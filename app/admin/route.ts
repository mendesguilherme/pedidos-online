// app/admin/route.ts
import { NextResponse } from "next/server";
export async function GET() {
  return new NextResponse("Gone", {
    status: 410,
    headers: { "X-Robots-Tag": "noindex, nofollow, noarchive" },
  });
}
