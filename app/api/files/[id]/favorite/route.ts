import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = await prisma.fileMetadata.findUnique({
    where: { fileId: params.id },
  });

  const newFavorite = !(existing?.isFavorite ?? false);

  const metadata = await prisma.fileMetadata.upsert({
    where: { fileId: params.id },
    create: { fileId: params.id, isFavorite: newFavorite },
    update: { isFavorite: newFavorite },
  });

  await logActivity("FAVORITE", params.id, newFavorite ? "Added to favorites" : "Removed from favorites");

  return NextResponse.json(metadata);
}
