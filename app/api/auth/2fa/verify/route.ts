import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { authenticator } from "otplib";
import { randomBytes } from "crypto";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, enable } = body;

  const response = NextResponse.json({ success: true });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  // Enable 2FA flow (already logged in, setting up)
  if (enable && session.isLoggedIn && session.userId) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user?.twoFactorSecret) return NextResponse.json({ error: "Setup 2FA first" }, { status: 400 });

    const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!valid) return NextResponse.json({ error: "Code invalide" }, { status: 401 });

    await prisma.user.update({ where: { id: session.userId }, data: { twoFactorEnabled: true } });
    return NextResponse.json({ success: true, message: "2FA activ\u00e9" });
  }

  // Login 2FA verification flow
  if (!session.pendingTwoFactor || !session.pendingUserId) {
    return NextResponse.json({ error: "No pending 2FA" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.pendingUserId } });
  if (!user?.twoFactorSecret) return NextResponse.json({ error: "2FA not configured" }, { status: 400 });

  const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
  if (!valid) return NextResponse.json({ error: "Code invalide" }, { status: 401 });

  session.isLoggedIn = true;
  session.userId = user.id;
  session.userRole = user.role;
  session.pendingTwoFactor = false;
  session.pendingUserId = undefined;
  session.csrfToken = randomBytes(32).toString("hex");
  await session.save();

  await logActivity("LOGIN", null, "Login with 2FA");
  return response;
}
