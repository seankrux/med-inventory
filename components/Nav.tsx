"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Nav() {
  const path = usePathname();
  const is = (p: string) => (path === p ? "active" : "");
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="logo" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="mark">℞</span>
          <span>
            Konsulta Inventory
            <br />
            <span className="sub">Medicine stock &amp; dispensing</span>
          </span>
        </Link>
        <nav className="nav">
          <Link className={is("/")} href="/">Dashboard</Link>
          <Link className={is("/dispense")} href="/dispense">Dispense</Link>
          <Link className={is("/receive")} href="/receive">Receive</Link>
        </nav>
      </div>
    </div>
  );
}
