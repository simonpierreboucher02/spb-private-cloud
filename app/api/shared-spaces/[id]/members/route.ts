import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const member = await prisma.sharedSpaceMember.create({
    data: { sharedSpaceId: params.id, userId },
    include: { user: { select: { id: true, name: true, username: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await request.json();
  await prisma.sharedSpaceMember.deleteMany({
    where: { sharedSpaceId: params.id, userId },
  });

  return NextResponse.json({ success: true });
}
