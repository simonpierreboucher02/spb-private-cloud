import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.tag.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { name, color } = await request.json();
  const data: Record<string, string> = {};
  if (name) data.name = name.trim();
  if (color) data.color = color;

  const tag = await prisma.tag.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(tag);
}
