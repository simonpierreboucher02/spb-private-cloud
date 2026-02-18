import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

async function validateApiKey(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const rawKey = auth.substring(7);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey;
}

export async function GET(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (!apiKey) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId");
  const where: Record<string, unknown> = {};
  if (folderId && folderId !== "root") where.folderId = folderId;
  else where.folderId = null;

  const files = await prisma.file.findMany({
    where,
    select: { id: true, name: true, size: true, mimeType: true, createdAt: true, folderId: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ files: files.map((f) => ({ ...f, size: Number(f.size) })) });
}
