import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { createHash } from "crypto";
import mime from "mime-types";

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
  else if (!folderId) where.folderId = null;

  const files = await prisma.file.findMany({
    where,
    select: { id: true, name: true, size: true, mimeType: true, createdAt: true, folderId: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ files: files.map((f) => ({ ...f, size: Number(f.size) })) });
}

export async function POST(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (!apiKey) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  if (!apiKey.permissions.includes("write") && !apiKey.permissions.includes("admin")) {
    return NextResponse.json({ error: "API key does not have write permission" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folderId = formData.get("folderId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const maxSize = parseInt(process.env.MAX_FILE_SIZE || "524288000");
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large. Max ${Math.round(maxSize / 1024 / 1024)}MB` }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = mime.lookup(file.name) || file.type || "application/octet-stream";
  const { storagePath, size } = await saveFile(buffer, file.name);

  const dbFile = await prisma.file.create({
    data: {
      name: file.name,
      storagePath,
      size: BigInt(size),
      mimeType,
      userId: apiKey.userId,
      folderId: folderId && folderId !== "root" ? folderId : null,
    },
  });

  return NextResponse.json({ ...dbFile, size: Number(dbFile.size) }, { status: 201 });
}
