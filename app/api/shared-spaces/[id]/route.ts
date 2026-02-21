import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const space = await prisma.sharedSpace.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, username: true } } } },
      folders: { select: { id: true, name: true, parentId: true } },
    },
  });

  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const agg = await prisma.file.aggregate({
    _sum: { size: true },
    where: { folder: { sharedSpaceId: params.id } },
  });

  return NextResponse.json({
    ...space,
    quotaBytes: Number(space.quotaBytes),
    usedBytes: Number(agg._sum.size || 0),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, quotaBytes } = await request.json();
  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (quotaBytes) data.quotaBytes = BigInt(quotaBytes);

  const space = await prisma.sharedSpace.update({ where: { id: params.id }, data });
  return NextResponse.json({ ...space, quotaBytes: Number(space.quotaBytes) });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.sharedSpace.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
