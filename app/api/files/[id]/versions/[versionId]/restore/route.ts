import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveVersion, restoreVersion } from "@/lib/storage";
import { logActivity } from "@/lib/activity";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  const file = await prisma.file.findUnique({ where: { id: params.id } });
  const version = await prisma.fileVersion.findUnique({
    where: { id: params.versionId },
  });

  if (!file || !version || version.fileId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Save current as new version first
  const versionCount = await prisma.fileVersion.count({ where: { fileId: file.id } });
  const currentVersion = await saveVersion(file.storagePath, file.name);

  await prisma.fileVersion.create({
    data: {
      fileId: file.id,
      versionNum: versionCount + 1,
      storagePath: currentVersion.storagePath,
      size: BigInt(currentVersion.size),
      changeNote: "Before restore",
    },
  });

  // Restore the selected version
  await restoreVersion(version.storagePath, file.storagePath);

  // Update file size
  await prisma.file.update({
    where: { id: params.id },
    data: { size: version.size },
  });

  await logActivity("VERSION_RESTORE", file.id, `Restored to version ${version.versionNum}`);

  return NextResponse.json({ success: true });
}
