import { NextResponse } from "next/server";
import { hasLiveCreds, readInventoryLive, readInventoryDemo } from "@/lib/sheets";
import { decorate } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { tab, items } = hasLiveCreds() ? await readInventoryLive() : readInventoryDemo();
    const low = decorate(items).filter((i) => i.low);
    return NextResponse.json({ ok: true, tab, items: low });
  } catch (e: any) {
    const { tab, items } = readInventoryDemo();
    return NextResponse.json({ ok: true, tab, items: decorate(items).filter((i) => i.low) });
  }
}
