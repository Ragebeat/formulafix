import type { Metadata } from "next";
import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fix Excel Formula Errors Instantly — FormulaFix",
  description:
    "Paste a broken Excel or Google Sheets formula and get a plain-English explanation plus a fixed version in seconds. Free, no signup.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site">
          <div className="container">
            <Link href="/" className="logo">
              Formula<span>Fix</span>
            </Link>
            <nav style={{ fontSize: 14, display: "flex", gap: 16, alignItems: "center" }}>
              <AuthStatus />
              <Link href="/#pro" style={{ color: "var(--muted)", textDecoration: "none" }}>
                Pro — $9/mo
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site">
          <div className="container">
            <span>© {new Date().getFullYear()} FormulaFix</span>
            <span>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
