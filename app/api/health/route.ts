import { NextResponse } from "next/server";
import { hasLiveCreds } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "konsulta-inventory",
    mode: hasLiveCreds() ? "live" : "demo",
    time: new Date().toISOString(),
  });
}
