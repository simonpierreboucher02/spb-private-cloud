import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Returns minimal user info (id, name, username) for any logged-in user
// Used for the shared folder member picker
export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { id: { not: session.userId } }, // exclude current user (they're added automatically)
    select: { id: true, name: true, username: true },
    orderBy: { username: "asc" },
  });

  return NextResponse.json(users);
}
