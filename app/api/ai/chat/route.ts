import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { aiChat } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, context } = await request.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  try {
    const reply = await aiChat(message, context);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: "Chat failed", details: (error as Error).message }, { status: 500 });
  }
}
