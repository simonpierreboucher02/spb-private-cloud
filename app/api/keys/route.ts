import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, keyPrefix: true, permissions: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(keys);
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, permissions, expiresAt } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const rawKey = `spb_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 12);

  await prisma.apiKey.create({
    data: { userId: session.userId, name, keyHash, keyPrefix, permissions: permissions || "read", expiresAt: expiresAt ? new Date(expiresAt) : null },
  });

  return NextResponse.json({ key: rawKey, prefix: keyPrefix }, { status: 201 });
}
