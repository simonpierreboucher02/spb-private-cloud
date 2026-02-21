import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

async function getAuthorized(request: NextRequest, id: string) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn || !session.userId) return null;
  const entry = await prisma.passwordEntry.findFirst({ where: { id, userId: session.userId } });
  return entry;
}

// Reveal decrypted password for a single entry
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entry = await getAuthorized(request, params.id);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...entry, password: decrypt(entry.password) });
  } catch (err) {
    console.error("[GET /api/passwords/[id]]", err);
    return NextResponse.json({ error: "Decrypt failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entry = await getAuthorized(request, params.id);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { siteName, siteUrl, username, password, notes } = await request.json();
    const data: Record<string, unknown> = {};
    if (siteName !== undefined) data.siteName = siteName.trim();
    if (siteUrl !== undefined) data.siteUrl = siteUrl?.trim() || null;
    if (username !== undefined) data.username = username?.trim() || null;
    if (password !== undefined) data.password = encrypt(password);
    if (notes !== undefined) data.notes = notes?.trim() || null;

    const updated = await prisma.passwordEntry.update({ where: { id: params.id }, data });
    return NextResponse.json({ ...updated, password: "••••••••" });
  } catch (err) {
    console.error("[PATCH /api/passwords/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entry = await getAuthorized(request, params.id);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.passwordEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/passwords/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
