import { NextRequest, NextResponse } from "next/server";
import { markAsRead } from "@/lib/notifications";

export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
  await markAsRead(params.id);
  return NextResponse.json({ success: true });
}
