"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import type { InventoryItem } from "@/lib/inventory";

export default function ReceivePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rowIndex, setRowIndex] = useState("");
  const [qty, setQty] = useState("");
  const [writePin, setWritePin] = useState("");
  const [msg, setMsg] = useState<{ t: string; cls: string }>({ t: "", cls: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/inventory").then((r) => r.json()).then((d) => setItems(d.items || []));
  }, []);

  const selected = items.find((i) => String(i.row) === rowIndex);

  async function submit() {
    setMsg({ t: "", cls: "" });
    if (!rowIndex) return setMsg({ t: "Pick a medicine line.", cls: "err" });
    const q = Number(qty);
    if (!q || q <= 0) return setMsg({ t: "Enter a quantity greater than zero.", cls: "err" });
    setBusy(true);
    try {
      const res = await fetch("/api/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex, qty: q, writePin }),
      });
      const d = await res.json();
      if (d.ok) {
        setMsg({ t: `Received ${q}. ${selected?.medicine} stock-received total is now ${d.received}.`, cls: "ok" });
        setQty("");
        fetch("/api/inventory").then((r) => r.json()).then((x) => setItems(x.items || []));
      } else {
        setMsg({ t: d.error || "Receive failed.", cls: "err" });
      }
    } catch (e: any) {
      setMsg({ t: e?.message || "Network error.", cls: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Nav />
      <div className="shell">
        <div className="hero">
          <h1>Receive stock</h1>
          <p>Log a delivery. The amount is added to “Stock Received” and the totals recompute.</p>
        </div>
        <div className="form-wrap">
          <div className="card">
            <h2>Add stock</h2>
            <p className="hint">Use this when new boxes arrive from the warehouse or supplier.</p>

            <label className="req">Medicine line</label>
            <select value={rowIndex} onChange={(e) => setRowIndex(e.target.value)}>
              <option value="">— choose —</option>
              {items.map((i) => (
                <option key={i.row} value={i.row}>
                  {i.medicine} ({i.remaining} left)
                </option>
              ))}
            </select>

            <label className="req">Quantity received</label>
            <input type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            {selected && (
              <div className="remaining-note">
                {selected.remaining} remaining · {selected.received} received so far
              </div>
            )}

            <label style={{ marginTop: 18 }}>Staff PIN</label>
            <input
              type="password"
              placeholder="required only if configured"
              value={writePin}
              onChange={(e) => setWritePin(e.target.value)}
            />

            <button className="btn" onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Add to stock"}
            </button>
            <div className={`msg ${msg.cls}`}>{msg.t}</div>
          </div>
        </div>
      </div>
    </>
  );
}
