import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, name: true, role: true, twoFactorEnabled: true, createdAt: true, _count: { select: { files: true, folders: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { username, name, password, role } = body;
  if (!username || !password) return NextResponse.json({ error: "Nom d'utilisateur et mot de passe requis" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "Nom d'utilisateur déjà utilisé" }, { status: 409 });

  const user = await prisma.user.create({
    data: { username, name: name || null, passwordHash: await hashPassword(password), role: role || "user" },
    select: { id: true, username: true, name: true, role: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}
