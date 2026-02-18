import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilePath } from "@/lib/storage";
import JSZip from "jszip";
import { readFileSync, existsSync } from "fs";

async function addFolderToZip(zip: JSZip, folderId: string, prefix: string) {
  const files = await prisma.file.findMany({ where: { folderId } });
  for (const file of files) {
    const filePath = getFilePath(file.storagePath);
    if (existsSync(filePath)) zip.file(prefix + file.name, readFileSync(filePath));
  }
  const subfolders = await prisma.folder.findMany({ where: { parentId: folderId } });
  for (const sub of subfolders) {
    await addFolderToZip(zip, sub.id, `${prefix}${sub.name}/`);
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const folder = await prisma.folder.findUnique({ where: { id: params.id } });
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const zip = new JSZip();
  await addFolderToZip(zip, folder.id, "");
  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(buffer, {
    headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${folder.name}.zip"` },
  });
}
