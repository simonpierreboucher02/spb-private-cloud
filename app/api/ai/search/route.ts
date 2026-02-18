import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { aiSearch } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await request.json();
  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

  try {
    const results = await aiSearch(query, session.userId);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: "AI search failed", details: (error as Error).message }, { status: 500 });
  }
}
