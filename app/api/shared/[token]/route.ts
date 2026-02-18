import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilePath } from "@/lib/storage";
import { readFile } from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const share = await prisma.sharedLink.findUnique({
    where: { token: params.token },
    include: { file: true },
  });

  if (!share || !share.active) {
    return NextResponse.json({ error: "Link not found or inactive" }, { status: 404 });
  }

  if (share.expiresAt && new Date() > share.expiresAt) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 });
  }

  if (share.passwordHash) {
    return NextResponse.json({
      requiresPassword: true,
      fileName: share.file.name,
      fileType: share.file.mimeType,
      mode: share.mode,
    });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "download" || share.mode === "DOWNLOAD") {
    const filePath = getFilePath(share.file.storagePath);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(share.file.name)}"`,
      },
    });
  }

  // Preview mode
  const filePath = getFilePath(share.file.storagePath);
  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": share.file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(share.file.name)}"`,
    },
  });
}
