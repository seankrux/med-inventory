import { NextResponse } from "next/server";
import { hasLiveCreds, dispenseLive, dispenseDemo } from "@/lib/sheets";

export const dynamic = "force-dynamic";

function checkPin(pin: string | undefined): boolean {
  const required = process.env.APP_WRITE_PIN;
  if (!required) return true; // no PIN configured = open (demo)
  return pin === required;
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const rowIndex = Number(b.rowIndex);
    const qty = Math.floor(Number(b.qty));
    if (!rowIndex || rowIndex < 2) return NextResponse.json({ ok: false, error: "Pick a medicine line." }, { status: 400 });
    if (!qty || qty <= 0) return NextResponse.json({ ok: false, error: "Quantity must be a positive whole number." }, { status: 400 });
    if (b.pin && !/^[0-9]{6,18}$/.test(String(b.pin))) {
      return NextResponse.json({ ok: false, error: "Patient PIN must be 6–18 digits." }, { status: 400 });
    }
    if (!checkPin(b.writePin)) return NextResponse.json({ ok: false, error: "Wrong staff PIN." }, { status: 401 });

    const result = hasLiveCreds()
      ? await dispenseLive(rowIndex, qty, String(b.medicine || ""))
      : dispenseDemo(rowIndex, qty);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 400 });
  }
}
