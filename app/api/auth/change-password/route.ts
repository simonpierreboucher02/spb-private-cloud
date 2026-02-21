import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Champs requis" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ success: true });
}
