import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const { active } = body;

  const share = await prisma.sharedLink.update({
    where: { id: params.id },
    data: { active },
  });

  if (!active) {
    await logActivity("UNSHARE", share.fileId, "Link deactivated");
  }

  return NextResponse.json(share);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const share = await prisma.sharedLink.findUnique({ where: { id: params.id } });
  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  await prisma.sharedLink.delete({ where: { id: params.id } });
  await logActivity("UNSHARE", share.fileId, "Link deleted");

  return NextResponse.json({ success: true });
}
