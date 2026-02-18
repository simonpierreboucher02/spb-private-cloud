import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import { readFileSync, existsSync } from "fs";
import { getFilePath } from "./storage";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function aiSearch(query: string, userId?: string): Promise<{
  results: Array<{ fileId: string; name: string; relevance: string; snippet: string }>;
  answer: string;
}> {
  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;

  const files = await prisma.file.findMany({
    where,
    select: { id: true, name: true, mimeType: true, size: true, aiTags: true, aiDescription: true, ocrText: true, createdAt: true, folder: { select: { name: true } } },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  const fileList = files.map((f) => {
    const parts = [`- ${f.name} (${f.mimeType}, ID:${f.id})`];
    if (f.folder) parts.push(`  Dossier: ${f.folder.name}`);
    if (f.aiDescription) parts.push(`  Description: ${f.aiDescription}`);
    if (f.aiTags) parts.push(`  Tags: ${f.aiTags}`);
    if (f.ocrText) parts.push(`  OCR: ${f.ocrText.substring(0, 200)}`);
    return parts.join("\n");
  }).join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Tu es un assistant de recherche de fichiers. Voici la liste des fichiers:\n\n${fileList}\n\nRecherche: "${query}"\n\nRéponds en JSON:\n{"results": [{"fileId": "...", "name": "...", "relevance": "high|medium|low", "snippet": "courte explication"}], "answer": "résumé"}` }],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return { results: [], answer: "Aucun résultat trouvé." };
}

export async function aiAutoTag(fileId: string): Promise<string[]> {
  const file = await prisma.file.findUnique({ where: { id: fileId }, select: { id: true, name: true, mimeType: true, size: true, ocrText: true, storagePath: true } });
  if (!file) return [];

  let contentHint = `Fichier: ${file.name}\nType: ${file.mimeType}\nTaille: ${Number(file.size)} bytes`;
  if (file.ocrText) contentHint += `\nContenu OCR: ${file.ocrText.substring(0, 500)}`;

  if (file.mimeType.startsWith("text/") || file.mimeType.includes("json") || file.mimeType.includes("xml")) {
    try {
      const filePath = getFilePath(file.storagePath);
      if (existsSync(filePath)) contentHint += `\nContenu: ${readFileSync(filePath, "utf-8").substring(0, 1000)}`;
    } catch {}
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    messages: [{ role: "user", content: `Analyse ce fichier et suggère 3-5 tags pertinents en français.\n\n${contentHint}\n\nRéponds UNIQUEMENT avec un JSON array de strings. Ex: ["finance", "rapport", "2024"]` }],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      const tags = JSON.parse(match[0]) as string[];
      await prisma.file.update({ where: { id: fileId }, data: { aiTags: JSON.stringify(tags) } });
      return tags;
    }
  } catch {}
  return [];
}

export async function aiDescribe(fileId: string): Promise<string> {
  const file = await prisma.file.findUnique({ where: { id: fileId }, select: { id: true, name: true, mimeType: true, storagePath: true, ocrText: true } });
  if (!file) return "";

  if (file.mimeType.startsWith("image/")) {
    try {
      const filePath = getFilePath(file.storagePath);
      if (existsSync(filePath)) {
        const base64 = readFileSync(filePath).toString("base64");
        const mediaType = file.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 256,
          messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "Décris cette image en une phrase concise en français." }] }],
        });
        const desc = response.content[0].type === "text" ? response.content[0].text : "";
        await prisma.file.update({ where: { id: fileId }, data: { aiDescription: desc } });
        return desc;
      }
    } catch {}
  }

  let hint = `Fichier: ${file.name}\nType: ${file.mimeType}`;
  if (file.mimeType.startsWith("text/") || file.mimeType.includes("json")) {
    try {
      const filePath = getFilePath(file.storagePath);
      if (existsSync(filePath)) hint += `\nContenu: ${readFileSync(filePath, "utf-8").substring(0, 2000)}`;
    } catch {}
  }
  if (file.ocrText) hint += `\nOCR: ${file.ocrText.substring(0, 500)}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 128,
    messages: [{ role: "user", content: `Décris ce fichier en une phrase concise en français:\n\n${hint}` }],
  });
  const desc = response.content[0].type === "text" ? response.content[0].text : "";
  await prisma.file.update({ where: { id: fileId }, data: { aiDescription: desc } });
  return desc;
}

export async function aiOcr(fileId: string): Promise<string> {
  const file = await prisma.file.findUnique({ where: { id: fileId }, select: { id: true, name: true, mimeType: true, storagePath: true } });
  if (!file) return "";

  if (file.mimeType.startsWith("image/")) {
    try {
      const filePath = getFilePath(file.storagePath);
      if (!existsSync(filePath)) return "";
      const base64 = readFileSync(filePath).toString("base64");
      const mediaType = file.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 2048,
        messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "Extrais tout le texte visible dans cette image. Retourne uniquement le texte extrait, sans commentaire." }] }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      await prisma.file.update({ where: { id: fileId }, data: { ocrText: text } });
      return text;
    } catch {}
  }

  if (file.mimeType === "application/pdf") {
    try {
      const filePath = getFilePath(file.storagePath);
      if (!existsSync(filePath)) return "";
      const base64 = readFileSync(filePath).toString("base64");
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }, { type: "text", text: "Extrais tout le texte de ce document PDF. Retourne uniquement le texte extrait." }] as Anthropic.ContentBlockParam[] }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      await prisma.file.update({ where: { id: fileId }, data: { ocrText: text } });
      return text;
    } catch {}
  }
  return "";
}

export async function aiChat(message: string, context?: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: "Tu es l'assistant IA de SPB Cloud, un cloud personnel privé. Aide l'utilisateur avec ses fichiers et réponds en français.",
    messages: [{ role: "user", content: context ? `Contexte:\n${context}\n\nQuestion: ${message}` : message }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}
