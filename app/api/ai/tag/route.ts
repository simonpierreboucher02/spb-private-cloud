import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { aiAutoTag } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId } = await request.json();
  if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

  try {
    const tags = await aiAutoTag(fileId);
    return NextResponse.json({ tags });
  } catch (error) {
    return NextResponse.json({ error: "Auto-tag failed", details: (error as Error).message }, { status: 500 });
  }
}
