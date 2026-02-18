import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let metadata = await prisma.fileMetadata.findUnique({
    where: { fileId: params.id },
  });

  if (!metadata) {
    metadata = await prisma.fileMetadata.create({
      data: { fileId: params.id },
    });
  }

  return NextResponse.json(metadata);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.description !== undefined) data.description = body.description;
  if (body.isFavorite !== undefined) data.isFavorite = body.isFavorite;
  if (body.customDates !== undefined) data.customDates = body.customDates;

  const metadata = await prisma.fileMetadata.upsert({
    where: { fileId: params.id },
    create: { fileId: params.id, ...data },
    update: data,
  });

  return NextResponse.json(metadata);
}
