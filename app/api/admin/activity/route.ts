import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: { file: { select: { name: true } } },
    }),
    prisma.activityLog.count(),
  ]);

  return NextResponse.json({ activities, total });
}
