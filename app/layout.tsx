import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konsulta Inventory — Medicine Stock & Dispensing",
  description: "Live medicine inventory and dispensing for PhilHealth Konsulta, backed by Google Sheets.",
  applicationName: "Konsulta Inventory",
  authors: [{ name: "Sean G" }],
  keywords: ["PhilHealth", "Konsulta", "pharmacy", "inventory", "dispensing", "medicine"],
  robots: { index: false, follow: false },
  openGraph: {
    title: "Konsulta Inventory",
    description: "Live medicine inventory and dispensing, backed by Google Sheets.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0e6b5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
