# Competitive Intelligence — DG Labs Inventory

_Last reviewed: 2026-06-18_

A scan of the 2026 medical / clinic / lab inventory market (Pabau, FlexScanMD,
SurgiCare, MedSupply, SafetyCulture) to position DG Labs Inventory and prioritize
the next features. The goal is not parity with enterprise suites — it is covering
the handful of capabilities clinics actually evaluate on.

## How DG Labs Inventory stacks up today

| Capability | Competitors | DG Labs Inventory |
|---|---|---|
| Item registry + stock levels | ✅ | ✅ |
| Dispense / receive with audit trail | ✅ | ✅ (`dispenses`, `stock_receipts`) |
| Low / critical reorder thresholds | ✅ | ✅ (`reorder_level`, dashboard alerts) |
| Role-based access | ✅ | ✅ (admin / staff) |
| **Manual user management** | ✅ | ✅ **(shipped this round)** |
| Categories | ✅ | ✅ (9 seeded) |
| Printable dispense receipt | partial | ✅ |
| **Batch / lot number tracking** | ✅ | ❌ |
| **Expiry-date tracking + alerts** | ✅ (table stakes) | ❌ |
| Barcode / QR scan in/out | ✅ | ❌ |
| Automated reorder / purchase orders | ✅ | ❌ |
| CSV / Excel import + export | ✅ | ❌ |
| Reporting / analytics dashboards | ✅ | partial (monthly stats only) |
| Multi-location / multi-site | ✅ (mid-market) | ❌ |
| EMR / accounting integration | ✅ (enterprise) | ❌ |

## Where we already win

- **Speed & focus.** No bloated onboarding. One clinic, one screen, low-motion
  clinical UI (see [DESIGN.md](DESIGN.md)). Competitors are heavy SaaS suites.
- **Cost.** Self-hosted on Supabase + Vercel free tiers vs. per-seat pricing.
- **Auditability for free.** Every dispense/receipt is attributed to a user and
  timestamped — a feature FlexScanMD markets as premium.

## Priority gaps (ranked by clinic impact ÷ effort)

1. **Expiry-date + batch/lot tracking** — _highest impact._ The single most-cited
   feature across every competitor; it is compliance table-stakes for medicine.
   Add `expiry_date` + `lot_number` to a per-batch table, surface an "Expiring
   soon" dashboard card next to Critical/Low. ~1 schema migration + 1 dashboard card.
2. **CSV import/export** — clinics arrive with spreadsheets (this repo literally
   ships from one). Bulk item import + export of current stock. Low effort, high adoption.
3. **Reporting** — consumption trends, dispense-by-category, wastage from expiry.
   Builds directly on the existing `dashboard_monthly_stats` RPC pattern.
4. **Barcode scan-to-dispense** — phone camera → item lookup. Differentiator for
   speed at the counter; can use the browser `BarcodeDetector` API, no new backend.
5. **Automated reorder suggestions** — we already compute low/critical; generate a
   one-click "reorder list" / PDF. Small step from current alert logic.

## This round delivered

- Manual **user management**: admins create users (instant sign-in, no email
  confirmation) and delete users from Dashboard → Users, on top of the existing
  promote/demote role controls. Backed by a service-role API route
  (`/api/admin/users`) gated to admins.
- Rebrand to **DG Labs Inventory** with a new animated, reduced-motion-aware
  logo mark.

Sources:
- [The 7 Best Medical Inventory Software of 2026 — SafetyCulture](https://safetyculture.com/apps/medical-inventory-software)
- [Medical Supply Expiration & Lot Number Tracking — SurgiCare](https://surgicaresoftware.com/Medical-Supply-Expiration-Tracking.html)
- [Medical Inventory Management Software — FlexScanMD](https://flexscanmd.com/medical-inventory-management-software/)
- [9 Best Med Spa Inventory Management Software (2026) — Pabau](https://pabau.com/blog/best-med-spa-inventory-management-software/)
