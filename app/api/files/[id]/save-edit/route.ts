import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile, saveVersion } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { MAX_VERSIONS_PER_FILE } from "@/lib/config";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await prisma.file.findUnique({ where: { id: params.id } });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const blob = formData.get("file") as File;
  const asNewVersion = formData.get("asNewVersion") === "true";

  if (!blob) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await blob.arrayBuffer());

  if (asNewVersion) {
    // Save current as version
    const versionCount = await prisma.fileVersion.count({ where: { fileId: file.id } });
    const versionResult = await saveVersion(file.storagePath, file.name);

    await prisma.fileVersion.create({
      data: {
        fileId: file.id,
        versionNum: versionCount + 1,
        storagePath: versionResult.storagePath,
        size: BigInt(versionResult.size),
        changeNote: "Before edit",
      },
    });

    // Cleanup old versions
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
  }

  // Save edited file
  const result = await saveFile(buffer, file.name);

  // Delete old file and update record
  const { deleteFile } = await import("@/lib/storage");
  await deleteFile(file.storagePath);

  const updated = await prisma.file.update({
    where: { id: params.id },
    data: {
      storagePath: result.storagePath,
      size: BigInt(result.size),
    },
  });

  await logActivity("EDIT", file.id, `Edited ${file.name}`);

  return NextResponse.json({
    ...updated,
    size: Number(updated.size),
  });
}
