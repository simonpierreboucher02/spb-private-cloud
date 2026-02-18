import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { tagId } = await request.json();

  if (!tagId) {
    return NextResponse.json({ error: "tagId required" }, { status: 400 });
  }

  const fileTag = await prisma.fileTag.create({
    data: { fileId: params.id, tagId },
    include: { tag: true },
  });

  await logActivity("TAG_ADD", params.id, `Tag added: ${fileTag.tag.name}`);
  return NextResponse.json(fileTag, { status: 201 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tags = await prisma.fileTag.findMany({
    where: { fileId: params.id },
    include: { tag: true },
  });
  return NextResponse.json(tags);
}
