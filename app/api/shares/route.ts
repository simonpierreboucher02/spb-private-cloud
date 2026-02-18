import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import bcrypt from "bcryptjs";

export async function GET() {
  const shares = await prisma.sharedLink.findMany({
    include: {
      file: { select: { name: true, mimeType: true, size: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = shares.map((s) => ({
    ...s,
    file: s.file ? { ...s.file, size: Number(s.file.size) } : null,
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fileId, expiresAt, password, mode } = body;

  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {
    fileId,
    mode: mode || "DOWNLOAD",
    active: true,
  };

  if (expiresAt) {
    data.expiresAt = new Date(expiresAt);
  }

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const share = await prisma.sharedLink.create({
    data: data as Parameters<typeof prisma.sharedLink.create>[0]["data"],
  });

  await logActivity("SHARE", fileId, `Shared ${file.name}`);

  return NextResponse.json(share, { status: 201 });
}
