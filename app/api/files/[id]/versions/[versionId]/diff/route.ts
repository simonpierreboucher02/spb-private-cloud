import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilePath, getVersionPath } from "@/lib/storage";
import { readFile } from "fs/promises";

export async function GET(
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

  // Only text files can be diffed
  if (!file.mimeType.startsWith("text/") && !file.mimeType.includes("json") && !file.mimeType.includes("xml") && !file.mimeType.includes("javascript") && !file.mimeType.includes("typescript")) {
    return NextResponse.json({ error: "Not a text file" }, { status: 400 });
  }

  const currentContent = await readFile(getFilePath(file.storagePath), "utf-8");
  const versionContent = await readFile(getVersionPath(version.storagePath), "utf-8");

  const Diff = await import("diff");
  const patch = Diff.createPatch(
    file.name,
    versionContent,
    currentContent,
    `Version ${version.versionNum}`,
    "Current"
  );

  return NextResponse.json({
    current: currentContent,
    version: versionContent,
    diff: patch,
  });
}
