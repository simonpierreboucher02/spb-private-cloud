import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const response = NextResponse.json({});
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ isLoggedIn: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, twoFactorEnabled: true },
  });

  return NextResponse.json({
    isLoggedIn: true,
    userId: session.userId,
    userRole: session.userRole,
    ...user,
  });
}
