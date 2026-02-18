import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId");
  const tree = searchParams.get("tree");

  if (tree === "true") {
    const folders = await prisma.folder.findMany({
      include: {
        children: {
          include: {
            children: {
              include: { children: true },
            },
          },
        },
        _count: { select: { files: true } },
      },
      where: { parentId: null },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(folders);
  }

  const where: Record<string, unknown> = {};
  if (parentId === "root" || parentId === null) {
    where.parentId = null;
  } else {
    where.parentId = parentId;
  }

  const folders = await prisma.folder.findMany({
    where,
    include: {
      _count: { select: { files: true, children: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(folders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, parentId } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Folder name required" }, { status: 400 });
  }

  const folder = await prisma.folder.create({
    data: {
      name: name.trim(),
      parentId: parentId && parentId !== "root" ? parentId : null,
    },
  });

  await logActivity("CREATE_FOLDER", null, `Created folder ${name}`);

  return NextResponse.json(folder, { status: 201 });
}
