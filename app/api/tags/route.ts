import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { files: true } } },
  });
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const { name, color } = await request.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const tag = await prisma.tag.create({
    data: { name: name.trim(), color: color || "#6b7280" },
  });

  return NextResponse.json(tag, { status: 201 });
}
