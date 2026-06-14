/**
 * Root layout — no supabase client here, purely structural.
 * Auth is handled by middleware.ts and client-side in pages.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Med Inventory",
  description: "Medical inventory management system",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
