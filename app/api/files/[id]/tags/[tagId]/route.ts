import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tagId: string } }
) {
  const fileTag = await prisma.fileTag.findFirst({
    where: { fileId: params.id, tagId: params.tagId },
    include: { tag: true },
  });

  if (!fileTag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await prisma.fileTag.delete({ where: { id: fileTag.id } });
  await logActivity("TAG_REMOVE", params.id, `Tag removed: ${fileTag.tag.name}`);

  return NextResponse.json({ success: true });
}
