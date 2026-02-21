import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  // Include files owned by user + legacy files with no owner (userId=null)
  const ownerFilter = session.userId
    ? { OR: [{ userId: session.userId as string }, { userId: null as null }] }
    : {};

  const files = await prisma.file.findMany({
    where: {
      AND: [
        ownerFilter,
        ...(q ? [{ name: { contains: q } }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      mimeType: true,
      size: true,
      aiTags: true,
      aiDescription: true,
      ocrText: true,
      folder: { select: { name: true } },
    },
    take: 30,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(files);
}
