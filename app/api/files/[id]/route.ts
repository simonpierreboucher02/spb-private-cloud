import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await prisma.file.findUnique({
    where: { id: params.id },
    include: { folder: true, sharedLinks: true },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ ...file, size: Number(file.size) });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { name, folderId } = body;

  const file = await prisma.file.findUnique({ where: { id: params.id } });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (name !== undefined) {
    updateData.name = name;
    await logActivity("RENAME", params.id, `Renamed to ${name}`);
  }

  if (folderId !== undefined) {
    updateData.folderId = folderId === "root" ? null : folderId;
    await logActivity("MOVE", params.id, `Moved to folder ${folderId}`);
  }

  const updated = await prisma.file.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ ...updated, size: Number(updated.size) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await prisma.file.findUnique({ where: { id: params.id } });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  await deleteFile(file.storagePath);
  await prisma.file.delete({ where: { id: params.id } });
  await logActivity("DELETE", null, `Deleted ${file.name}`);

  return NextResponse.json({ success: true });
}
