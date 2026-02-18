import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilePath, saveVersion } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { writeFile, stat } from "fs/promises";
import { MAX_VERSIONS_PER_FILE } from "@/lib/config";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await prisma.file.findUnique({ where: { id: params.id } });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const content = await request.text();
  const filePath = getFilePath(file.storagePath);

  // Create version before overwriting
  const versionCount = await prisma.fileVersion.count({ where: { fileId: file.id } });
  const versionResult = await saveVersion(file.storagePath, file.name);

  await prisma.fileVersion.create({
    data: {
      fileId: file.id,
      versionNum: versionCount + 1,
      storagePath: versionResult.storagePath,
      size: BigInt(versionResult.size),
      changeNote: "Auto-save",
    },
  });

  // Cleanup old versions if over limit
  const versions = await prisma.fileVersion.findMany({
    where: { fileId: file.id },
    orderBy: { versionNum: "asc" },
  });
  if (versions.length > MAX_VERSIONS_PER_FILE) {
    const toDelete = versions.slice(0, versions.length - MAX_VERSIONS_PER_FILE);
    for (const v of toDelete) {
      const { deleteVersion } = await import("@/lib/storage");
      await deleteVersion(v.storagePath);
      await prisma.fileVersion.delete({ where: { id: v.id } });
    }
  }

  // Write new content
  await writeFile(filePath, content, "utf-8");
  const newStat = await stat(filePath);

  await prisma.file.update({
    where: { id: params.id },
    data: { size: BigInt(newStat.size) },
  });

  await logActivity("EDIT", file.id, `Edited ${file.name}`);

  return NextResponse.json({ success: true, size: Number(newStat.size) });
}
