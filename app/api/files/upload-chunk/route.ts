import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveChunk, assembleChunks } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import mime from "mime-types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const chunk = formData.get("chunk") as File | null;
  const uploadId = formData.get("uploadId") as string;
  const chunkIndex = parseInt(formData.get("chunkIndex") as string);
  const totalChunks = parseInt(formData.get("totalChunks") as string);
  const fileName = formData.get("fileName") as string;
  const folderId = formData.get("folderId") as string | null;

  if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName) {
    return NextResponse.json({ error: "Missing chunk data" }, { status: 400 });
  }

  const buffer = Buffer.from(await chunk.arrayBuffer());
  await saveChunk(buffer, uploadId, chunkIndex);

  // If this is the last chunk, assemble
  if (chunkIndex === totalChunks - 1) {
    const { storagePath, size } = await assembleChunks(uploadId, totalChunks, fileName);
    const mimeType = mime.lookup(fileName) || "application/octet-stream";

    const dbFile = await prisma.file.create({
      data: {
        name: fileName,
        storagePath,
        size: BigInt(size),
        mimeType,
        folderId: folderId && folderId !== "root" ? folderId : null,
      },
    });

    await logActivity("UPLOAD", dbFile.id, `Uploaded ${fileName} (chunked)`);

    return NextResponse.json(
      { ...dbFile, size: Number(dbFile.size), complete: true },
      { status: 201 }
    );
  }

  return NextResponse.json({ chunkIndex, received: true });
}
