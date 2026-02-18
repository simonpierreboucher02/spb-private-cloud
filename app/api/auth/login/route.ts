import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const allowed = await checkLoginRateLimit(ip);
  if (!allowed) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 1 minute." }, { status: 429 });

  const body = await request.json();
  const { password, email } = body;
  if (!password) return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });

  const { valid, user } = await verifyPassword(password, email || undefined);
  if (!valid || !user) return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });

  const response = NextResponse.json({ success: true, requires2FA: user.twoFactorEnabled });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  if (user.twoFactorEnabled) {
    session.pendingTwoFactor = true;
    session.pendingUserId = user.id;
    await session.save();
    return response;
  }

  session.isLoggedIn = true;
  session.userId = user.id;
  session.userRole = user.role;
  session.csrfToken = randomBytes(32).toString("hex");
  await session.save();

  await logActivity("LOGIN", null, `Login from ${ip}`);
  return response;
}
