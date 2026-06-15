import { NextResponse } from "next/server";
import { hasLiveCreds, readInventoryLive, readInventoryDemo } from "@/lib/sheets";
import { decorate, type InventoryResponse } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || undefined;
  try {
    if (hasLiveCreds()) {
      const { tab, items } = await readInventoryLive(month);
      const body: InventoryResponse = {
        ok: true, source: "sheet", tab, items: decorate(items),
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(body);
    }
    const { tab, items } = readInventoryDemo();
    const body: InventoryResponse = {
      ok: true, source: "snapshot", tab, items: decorate(items),
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(body);
  } catch (e: any) {
    const { tab, items } = readInventoryDemo();
    return NextResponse.json({
      ok: true, source: "snapshot", tab, items: decorate(items),
      generatedAt: new Date().toISOString(),
      error: `Live read failed, showing snapshot: ${e?.message || e}`,
    } as InventoryResponse);
  }
}
