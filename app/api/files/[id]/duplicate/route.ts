import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { duplicateFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await prisma.file.findUnique({ where: { id: params.id } });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { storagePath, size } = await duplicateFile(file.storagePath, file.name);

  const duplicated = await prisma.file.create({
    data: {
      name: `${file.name} (copy)`,
      storagePath,
      size: BigInt(size),
      mimeType: file.mimeType,
      folderId: file.folderId,
    },
  });

  await logActivity("UPLOAD", duplicated.id, `Duplicated ${file.name}`);

  return NextResponse.json(
    { ...duplicated, size: Number(duplicated.size) },
    { status: 201 }
  );
}
