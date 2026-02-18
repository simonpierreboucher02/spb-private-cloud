import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const folder = await prisma.folder.findUnique({
    where: { id: params.id },
    include: {
      children: {
        include: { _count: { select: { files: true, children: true } } },
        orderBy: { name: "asc" },
      },
      files: { orderBy: { createdAt: "desc" } },
      parent: true,
    },
  });

  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...folder,
    files: folder.files.map((f) => ({ ...f, size: Number(f.size) })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { name } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const folder = await prisma.folder.update({
    where: { id: params.id },
    data: { name: name.trim() },
  });

  return NextResponse.json(folder);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Recursively delete all files in this folder and subfolders
  async function deleteRecursive(folderId: string) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true, children: true },
    });

    if (!folder) return;

    // Delete files
    for (const file of folder.files) {
      await deleteFile(file.storagePath);
    }

    // Recurse into children
    for (const child of folder.children) {
      await deleteRecursive(child.id);
    }
  }

  await deleteRecursive(params.id);

  // Prisma cascade will handle DB records
  await prisma.folder.delete({ where: { id: params.id } });

  await logActivity("DELETE_FOLDER", null, `Deleted folder ${params.id}`);

  return NextResponse.json({ success: true });
}
