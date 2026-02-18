import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { getNotifications, markAllAsRead, getUnreadCount } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const countOnly = searchParams.get("count") === "true";

  if (countOnly) {
    const count = await getUnreadCount(session.userId);
    return NextResponse.json({ count });
  }

  const notifications = await getNotifications(session.userId, unreadOnly);
  return NextResponse.json(notifications);
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn || !session.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await request.json();
  if (action === "mark_all_read") {
    await markAllAsRead(session.userId);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
