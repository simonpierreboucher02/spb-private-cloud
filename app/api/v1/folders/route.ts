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

  const folders = await prisma.folder.findMany({
    select: { id: true, name: true, parentId: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ folders });
}

export async function POST(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (!apiKey) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  if (!apiKey.permissions.includes("write") && !apiKey.permissions.includes("admin")) {
    return NextResponse.json({ error: "API key does not have write permission" }, { status: 403 });
  }

  const { name, parentId } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const folder = await prisma.folder.create({
    data: {
      name,
      parentId: parentId || null,
      userId: apiKey.userId,
    },
  });

  return NextResponse.json(folder, { status: 201 });
}
