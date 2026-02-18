import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const metadata = await prisma.fileMetadata.findUnique({
    where: { fileId: params.id },
  });

  return NextResponse.json({ annotations: metadata?.annotations || null });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { annotations } = await request.json();

  const metadata = await prisma.fileMetadata.upsert({
    where: { fileId: params.id },
    create: { fileId: params.id, annotations },
    update: { annotations },
  });

  await logActivity("ANNOTATE", params.id, "Annotations updated");

  return NextResponse.json(metadata);
}
