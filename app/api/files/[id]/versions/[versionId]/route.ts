import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVersionPath } from "@/lib/storage";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  const version = await prisma.fileVersion.findUnique({
    where: { id: params.versionId },
    include: { file: true },
  });

  if (!version || version.fileId !== params.id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const filePath = getVersionPath(version.storagePath);
  const fileStat = await stat(filePath);

  const stream = createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(version.file.name)}"`,
      "Content-Length": String(fileStat.size),
    },
  });
}
