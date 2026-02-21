import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const spaces = await prisma.sharedSpace.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, folders: true } },
      members: { include: { user: { select: { id: true, name: true, username: true } } } },
    },
  });

  const result = await Promise.all(
    spaces.map(async (space) => {
      const agg = await prisma.file.aggregate({
        _sum: { size: true },
        where: { folder: { sharedSpaceId: space.id } },
      });
      return {
        ...space,
        quotaBytes: Number(space.quotaBytes),
        usedBytes: Number(agg._sum.size || 0),
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  // Any logged-in user can create a shared space
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, memberIds, quotaBytes } = await request.json();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  // Always include the creator as a member
  const allMemberIds = Array.from(new Set([session.userId, ...(memberIds || [])]));

  const space = await prisma.sharedSpace.create({
    data: {
      name,
      quotaBytes: quotaBytes ? BigInt(quotaBytes) : BigInt(536870912000),
      members: { create: allMemberIds.map((userId: string) => ({ userId })) },
    },
    include: {
      _count: { select: { members: true, folders: true } },
      members: { include: { user: { select: { id: true, name: true, username: true } } } },
    },
  });

  return NextResponse.json({ ...space, quotaBytes: Number(space.quotaBytes), usedBytes: 0 }, { status: 201 });
}
