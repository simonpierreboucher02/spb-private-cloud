import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { buildFileContext, ChatMessage } from "@/lib/ai";
import { getFilePath } from "@/lib/storage";
import { existsSync, readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

// Find a file mentioned by name in the user message
async function findMentionedFile(message: string, userId?: string) {
  const where = userId
    ? { OR: [{ userId }, { userId: null }] }
    : {};

  const files = await prisma.file.findMany({
    where,
    select: { id: true, name: true, mimeType: true, storagePath: true, ocrText: true },
    orderBy: { createdAt: "desc" },
  });

  const msgLower = message.toLowerCase();
  // Sort by name length desc so longer/more specific names match first
  const sorted = [...files].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((f) => msgLower.includes(f.name.toLowerCase())) ?? null;
}

// Build content blocks for a file to send to Claude
async function buildFileBlocks(file: {
  name: string;
  mimeType: string;
  storagePath: string;
  ocrText: string | null;
}): Promise<Anthropic.ContentBlockParam[]> {
  const filePath = getFilePath(file.storagePath);
  if (!existsSync(filePath)) return [];

  try {
    // PDFs — send as native document block (Claude reads PDFs natively)
    if (file.mimeType === "application/pdf") {
      const base64 = readFileSync(filePath).toString("base64");
      return [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64 },
        } as Anthropic.ContentBlockParam,
      ];
    }

    // Images — send as image block (base64)
    if (file.mimeType.startsWith("image/")) {
      const supported = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (supported.includes(file.mimeType)) {
        const base64 = readFileSync(filePath).toString("base64");
        return [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: file.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64,
            },
          },
        ];
      }
    }

    // Word documents — extract text via mammoth
    if (
      file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimeType === "application/msword"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: filePath });
      const text = result.value.substring(0, 50000);
      if (text.trim()) {
        return [{ type: "text", text: `Contenu du document Word "${file.name}":\n${text}` }];
      }
    }

    // Excel spreadsheets — extract as CSV via SheetJS
    if (
      file.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimeType === "application/vnd.ms-excel"
    ) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.readFile(filePath);
      const parts: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        parts.push(`[Feuille: ${sheetName}]\n${csv.substring(0, 15000)}`);
      }
      const content = parts.join("\n\n").substring(0, 50000);
      if (content.trim()) {
        return [{ type: "text", text: `Contenu du tableur Excel "${file.name}":\n${content}` }];
      }
    }

    // Text / code / markdown / JSON — read directly
    if (
      file.mimeType.startsWith("text/") ||
      file.mimeType.includes("json") ||
      file.mimeType.includes("xml") ||
      file.mimeType.includes("markdown")
    ) {
      const content = readFileSync(filePath, "utf-8").substring(0, 50000);
      return [
        { type: "text", text: `Contenu du fichier "${file.name}":\n\`\`\`\n${content}\n\`\`\`` },
      ];
    }

    // Fallback: use OCR text if available
    if (file.ocrText) {
      return [
        { type: "text", text: `Texte extrait du fichier "${file.name}" (OCR):\n${file.ocrText}` },
      ];
    }
  } catch (err) {
    console.error("[chat] buildFileBlocks error:", err);
  }
  return [];
}

export async function POST(request: NextRequest) {
  const tempResponse = new NextResponse();
  const session = await getIronSession<SessionData>(request, tempResponse, sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, history = [], stream: wantStream = true } = await request.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  try {
    const [fileContext, mentionedFile] = await Promise.all([
      buildFileContext(session.userId!),
      findMentionedFile(message, session.userId),
    ]);

    const systemPrompt = `Tu es l'assistant IA de SPB Cloud, un cloud personnel privé. Tu aides l'utilisateur avec ses fichiers et réponds toujours en français. Sois concis et précis. Tu peux utiliser le markdown (gras, listes, code) pour structurer tes réponses. Quand on te donne un fichier, lis-en le contenu et réponds directement en te basant dessus.

${fileContext}`;

    // Build user message — attach file content if a file is mentioned
    let userContent: Anthropic.ContentBlockParam[];
    if (mentionedFile) {
      const fileBlocks = await buildFileBlocks(mentionedFile);
      if (fileBlocks.length > 0) {
        userContent = [...fileBlocks, { type: "text", text: message }];
      } else {
        // File found but couldn't read it — mention ocrText if available
        const fallback = mentionedFile.ocrText
          ? `[Contenu OCR de "${mentionedFile.name}"]\n${mentionedFile.ocrText}\n\n`
          : "";
        userContent = [{ type: "text", text: fallback + message }];
      }
    } else {
      userContent = [{ type: "text", text: message }];
    }

    const messages: Anthropic.MessageParam[] = [
      ...(history as ChatMessage[]).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userContent },
    ];

    if (!wantStream) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      });
      const reply = response.content[0].type === "text" ? response.content[0].text : "";
      return NextResponse.json({ reply });
    }

    // Streaming
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            system: systemPrompt,
            messages,
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token: chunk.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: (err as Error).message })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Chat failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
