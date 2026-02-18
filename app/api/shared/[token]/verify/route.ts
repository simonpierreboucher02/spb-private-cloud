import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilePath } from "@/lib/storage";
import { readFile } from "fs/promises";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const body = await request.json();
  const { password } = body;

  const share = await prisma.sharedLink.findUnique({
    where: { token: params.token },
    include: { file: true },
  });

  if (!share || !share.active) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  if (share.expiresAt && new Date() > share.expiresAt) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  if (!share.passwordHash) {
    return NextResponse.json({ error: "No password required" }, { status: 400 });
  }

  const valid = await bcrypt.compare(password, share.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const filePath = getFilePath(share.file.storagePath);
  const buffer = await readFile(filePath);

  const isDownload = share.mode === "DOWNLOAD";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": isDownload ? "application/octet-stream" : share.file.mimeType,
      "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${encodeURIComponent(share.file.name)}"`,
    },
  });
}
