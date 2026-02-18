import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.apiKey.delete({ where: { id: params.id, userId: session.userId } });
  return NextResponse.json({ success: true });
}
