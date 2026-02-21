import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await prisma.passwordEntry.findMany({
      where: { userId: session.userId },
      orderBy: { siteName: "asc" },
    });

    const { searchParams } = new URL(request.url);
    const withPasswords = searchParams.get("reveal") === "1";

    return NextResponse.json(
      entries.map((e) => ({
        ...e,
        password: withPasswords ? (() => { try { return decrypt(e.password); } catch { return ""; } })() : "••••••••",
      }))
    );
  } catch (err) {
    console.error("[GET /api/passwords]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteName, siteUrl, username, password, notes } = body;
    if (!siteName || !password) {
      return NextResponse.json({ error: "siteName et password requis" }, { status: 400 });
    }

    const encryptedPassword = encrypt(password);

    const entry = await prisma.passwordEntry.create({
      data: {
        userId: session.userId,
        siteName: siteName.trim(),
        siteUrl: siteUrl?.trim() || null,
        username: username?.trim() || null,
        password: encryptedPassword,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ ...entry, password: "••••••••" }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/passwords]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
