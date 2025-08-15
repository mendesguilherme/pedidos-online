// app/admin/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export function GET() {
  return new NextResponse("Este caminho foi movido para /painel.", { status: 410 });
}
export const POST = GET;
