import { NextResponse } from "next/server";
import { getUserNotifications } from "@/app/actions/notifications";

export async function GET() {
  const result = await getUserNotifications(20);
  if (!result.success) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
  return NextResponse.json({
    notifications: result.notifications,
    unreadCount: result.unreadCount,
  });
}
