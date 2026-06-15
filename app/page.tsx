"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import type { InventoryItem, InventoryResponse } from "@/lib/inventory";

export default function Dashboard() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((d: InventoryResponse) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const items = data?.items ?? [];
  const cats = useMemo(
    () => Array.from(new Set(items.map((i) => i.category || "Uncategorized"))).sort(),
    [items]
  );
  const lowItems = items.filter((i) => i.low);
  const totalDispensed = items.reduce((a, i) => a + i.dispensed, 0);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return items.filter((i) => {
      const hitQ = (i.medicine + " " + i.category).toLowerCase().includes(needle);
      const hitCat = cat === "all" || (i.category || "Uncategorized") === cat;
      const hitLow = !lowOnly || i.low;
      return hitQ && hitCat && hitLow;
    });
  }, [items, q, cat, lowOnly]);

  const grouped = useMemo(() => {
    const g: Record<string, InventoryItem[]> = {};
    for (const i of filtered) (g[i.category || "Uncategorized"] ||= []).push(i);
    return g;
  }, [filtered]);

  return (
    <>
      <Nav />
      <div className="shell">
        <div className="hero">
          <h1>Medicine inventory</h1>
          <p>
            Live stock across the {data?.tab ?? "current"} ledger. Each brand and strength is its own line —
            dispense and receiving write straight back to the sheet.
          </p>
          {data && (
            <span className={`source-chip ${data.source === "sheet" ? "live" : "demo"}`}>
              <span className="dot" />
              {data.source === "sheet"
                ? `Live — Google Sheet (${data.tab})`
                : "Demo data — add Google credentials to go live"}
            </span>
          )}
        </div>

        <div className="kpis">
          <div className="kpi">
            <div className="label">Medicine lines</div>
            <div className="value">{loading ? "—" : items.length}</div>
            <div className="foot">{cats.length} categories</div>
          </div>
          <div className="kpi">
            <div className="label">Low stock</div>
            <div className={`value ${lowItems.length ? "alert" : ""}`}>{loading ? "—" : lowItems.length}</div>
            <div className="foot">at or below reorder level</div>
          </div>
          <div className="kpi">
            <div className="label">Dispensed</div>
            <div className="value">{loading ? "—" : totalDispensed}</div>
            <div className="foot">this period</div>
          </div>
          <div className="kpi">
            <div className="label">In stock</div>
            <div className="value">{loading ? "—" : items.reduce((a, i) => a + i.remaining, 0)}</div>
            <div className="foot">total pieces remaining</div>
          </div>
        </div>

        {lowItems.length > 0 && (
          <div className="lowpanel">
            <h3>⚠ {lowItems.length} item{lowItems.length > 1 ? "s" : ""} need reordering</h3>
            <ul>
              {lowItems.map((i) => (
                <li key={i.row}>
                  <span>{i.medicine}</span>
                  <b>
                    {i.remaining} left · reorder {i.effectiveReorder}
                  </b>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="toolbar">
          <div className="search">
            <span aria-hidden>🔍</span>
            <input
              placeholder="Search medicine or category…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search medicines"
            />
          </div>
          <div className="chips">
            <button className={`chip ${cat === "all" ? "active" : ""}`} onClick={() => setCat("all")}>
              All
            </button>
            {cats.map((c) => (
              <button key={c} className={`chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
            <button
              className={`chip alert ${lowOnly ? "active" : ""}`}
              onClick={() => setLowOnly((v) => !v)}
            >
              Low only
            </button>
          </div>
          {!loading && (q || cat !== "all" || lowOnly) && (
            <span className="count" style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
              {filtered.length} of {items.length} lines
            </span>
          )}
        </div>

        {loading ? (
          <div className="rows">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 58 }} />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="empty">No medicines match your filters. Clear the search to see everything.</div>
        ) : (
          Object.keys(grouped)
            .sort()
            .map((category) => (
              <div key={category}>
                <div className="cat-head">
                  <span className="name">{category}</span>
                  <span className="rule" />
                  <span className="count">{grouped[category].length}</span>
                </div>
                <div className="rows">
                  {grouped[category].map((i) => (
                    <div key={i.row} className={`med ${i.low ? "low" : ""}`}>
                      <div className="name">
                        {i.medicine}
                        {i.low && <span className="badge-low">reorder</span>}
                        <div className="meta">
                          Begin {i.beginning} · Received {i.received} · Dispensed {i.dispensed}
                        </div>
                      </div>
                      <div className="vial" title={`${i.remaining} of ${i.available} remaining`}>
                        <div className="tube">
                          <div className="fill" style={{ width: `${i.pct}%` }} />
                        </div>
                        <span className="pct">{i.pct}%</span>
                      </div>
                      <div className="stat">
                        <div className={`big ${i.low ? "alert" : ""}`}>{i.remaining}</div>
                        <div className="lbl">remaining</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}

        <div className="footer">
          Source of truth: <code>{data?.tab}</code> · Generated{" "}
          {data ? new Date(data.generatedAt).toLocaleString() : "—"}
          {data?.error ? ` · ${data.error}` : ""}
        </div>
      </div>
    </>
  );
}
