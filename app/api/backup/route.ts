import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { requireAdmin } from "@/lib/auth";
import { createBackup, listBackups, deleteBackup } from "@/lib/backup";

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const backups = await listBackups();
  return NextResponse.json(backups);
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  try {
    const result = await createBackup(body.type || "full");
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.userId || !(await requireAdmin(session.userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  const ok = await deleteBackup(id);
  return NextResponse.json({ success: ok });
}
