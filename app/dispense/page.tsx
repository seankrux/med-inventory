"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import type { InventoryItem } from "@/lib/inventory";

export default function DispensePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rowIndex, setRowIndex] = useState("");
  const [qty, setQty] = useState("");
  const [date, setDate] = useState("");
  const [writePin, setWritePin] = useState("");
  const [ep, setEp] = useState({ pin: "", age: "", name: "", caseNo: "", txn: "", physician: "", prc: "" });
  const [msg, setMsg] = useState<{ t: string; cls: string }>({ t: "", cls: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/inventory").then((r) => r.json()).then((d) => setItems(d.items || []));
    setDate(new Date().toISOString().slice(0, 10));
  }, []);

  const selected = items.find((i) => String(i.row) === rowIndex);

  async function submit() {
    setMsg({ t: "", cls: "" });
    if (!rowIndex) return setMsg({ t: "Pick a medicine line.", cls: "err" });
    const q = Number(qty);
    if (!q || q <= 0) return setMsg({ t: "Enter a quantity greater than zero.", cls: "err" });
    if (selected && q > selected.remaining)
      return setMsg({ t: `Only ${selected.remaining} left for ${selected.medicine}.`, cls: "err" });

    setBusy(true);
    try {
      const res = await fetch("/api/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex, qty: q, medicine: selected?.medicine, dateISO: date, writePin,
          pin: ep.pin, age: ep.age, patientName: ep.name, caseNo: ep.caseNo,
          transactionNo: ep.txn, physician: ep.physician, prcLic: ep.prc,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setMsg({ t: `Dispensed ${q}. ${selected?.medicine} now has ${d.remaining} left (${d.tab}).`, cls: "ok" });
        setQty("");
        // refresh stock
        fetch("/api/inventory").then((r) => r.json()).then((x) => setItems(x.items || []));
      } else {
        setMsg({ t: d.error || "Dispense failed.", cls: "err" });
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
          <h1>Dispense medicine</h1>
          <p>Record what you handed out against an ePresS. Stock decrements and writes back to the sheet.</p>
        </div>
        <div className="form-wrap">
          <div className="card">
            <h2>New dispense</h2>
            <p className="hint">Quantity is checked against remaining stock before anything is written.</p>

            <label className="req">Medicine line</label>
            <select value={rowIndex} onChange={(e) => setRowIndex(e.target.value)}>
              <option value="">— choose —</option>
              {items.map((i) => (
                <option key={i.row} value={i.row}>
                  {i.medicine} ({i.remaining} left)
                </option>
              ))}
            </select>

            <div className="grid2">
              <div>
                <label className="req">Quantity</label>
                <input type="number" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div>
                <label>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            {selected && <div className="remaining-note">{selected.remaining} remaining before this dispense</div>}

            <details className="epress">
              <summary>ePresS details (optional)</summary>
              <div className="grid2">
                <div>
                  <label>Patient PIN</label>
                  <input inputMode="numeric" value={ep.pin} onChange={(e) => setEp({ ...ep, pin: e.target.value })} />
                </div>
                <div>
                  <label>Age</label>
                  <input type="number" min={0} value={ep.age} onChange={(e) => setEp({ ...ep, age: e.target.value })} />
                </div>
              </div>
              <label>Patient name</label>
              <input value={ep.name} onChange={(e) => setEp({ ...ep, name: e.target.value })} />
              <div className="grid2">
                <div>
                  <label>Case No.</label>
                  <input value={ep.caseNo} onChange={(e) => setEp({ ...ep, caseNo: e.target.value })} />
                </div>
                <div>
                  <label>Transaction No.</label>
                  <input value={ep.txn} onChange={(e) => setEp({ ...ep, txn: e.target.value })} />
                </div>
              </div>
              <div className="grid2">
                <div>
                  <label>Physician</label>
                  <input value={ep.physician} onChange={(e) => setEp({ ...ep, physician: e.target.value })} />
                </div>
                <div>
                  <label>PRC Lic No.</label>
                  <input value={ep.prc} onChange={(e) => setEp({ ...ep, prc: e.target.value })} />
                </div>
              </div>
            </details>

            <label style={{ marginTop: 18 }}>Staff PIN</label>
            <input
              type="password"
              placeholder="required only if configured"
              value={writePin}
              onChange={(e) => setWritePin(e.target.value)}
            />

            <button className="btn" onClick={submit} disabled={busy}>
              {busy ? "Saving…" : "Dispense"}
            </button>
            <div className={`msg ${msg.cls}`}>{msg.t}</div>
          </div>
        </div>
      </div>
    </>
  );
}
