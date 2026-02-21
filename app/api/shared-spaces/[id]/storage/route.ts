import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const space = await prisma.sharedSpace.findUnique({ where: { id: params.id } });
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const agg = await prisma.file.aggregate({
    _sum: { size: true },
    where: { folder: { sharedSpaceId: params.id } },
  });

  const quotaBytes = Number(space.quotaBytes);
  const usedBytes = Number(agg._sum.size || 0);
  const percent = quotaBytes > 0 ? Math.round((usedBytes / quotaBytes) * 100) : 0;

  return NextResponse.json({ quotaBytes, usedBytes, percent });
}
