/**
 * Root layout — no supabase client here, purely structural.
 * Auth is handled by proxy.ts and client-side in pages.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DG Labs Inventory",
  description: "Medical inventory management for DG Labs",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
