import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveVersion } from "@/lib/storage";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const versions = await prisma.fileVersion.findMany({
    where: { fileId: params.id },
    orderBy: { versionNum: "desc" },
  });

  return NextResponse.json(
    versions.map((v) => ({ ...v, size: Number(v.size) }))
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await prisma.file.findUnique({ where: { id: params.id } });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const changeNote = body.changeNote || "Manual snapshot";

  const versionCount = await prisma.fileVersion.count({ where: { fileId: file.id } });
  const result = await saveVersion(file.storagePath, file.name);

  const version = await prisma.fileVersion.create({
    data: {
      fileId: file.id,
      versionNum: versionCount + 1,
      storagePath: result.storagePath,
      size: BigInt(result.size),
      changeNote,
    },
  });

  await logActivity("VERSION_CREATE", file.id, `Version ${version.versionNum} created`);

  return NextResponse.json({ ...version, size: Number(version.size) }, { status: 201 });
}
