import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.sharedSpaceMember.findMany({
    where: { userId: session.userId },
    include: { sharedSpace: true },
  });

  return NextResponse.json(
    memberships.map((m) => ({
      ...m.sharedSpace,
      quotaBytes: Number(m.sharedSpace.quotaBytes),
    }))
  );
}
