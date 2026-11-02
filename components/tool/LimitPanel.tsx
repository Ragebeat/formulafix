"use client";

import { useState } from "react";
import type { LimitTier } from "./useAnalyze";

type Sent = null | "demo" | "real";

/** Shown when the daily quota is used up: sign in for more (anon) or upgrade (free). */
export default function LimitPanel({ tier, onClose }: { tier: LimitTier; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<Sent>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMagicLink() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setSent(data.demo ? "demo" : "real");
      else setError(data.message || "Could not send the link. Check the address and try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function goPro() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        location.href = data.url;
        return;
      }
      setError(data.message || "Payments are not set up yet.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {sent === "real" ? (
          <p className="success">Check your email: we sent you a sign-in link.</p>
        ) : sent === "demo" ? (
          <p className="success">You&apos;re on the list. (Sign-in is off in demo mode.)</p>
        ) : tier === "free" ? (
          <>
            <h3>You&apos;ve used your 5 daily fixes</h3>
            <p>Go unlimited with Pro: $9/mo, cancel anytime.</p>
            <button className="btn-primary" onClick={goPro} disabled={busy}>
              {busy ? "Redirecting…" : "Go Pro, $9/mo"}
            </button>
          </>
        ) : (
          <>
            <h3>You&apos;ve used your 3 free fixes today</h3>
            <p>
              Get 5 fixes per day free: enter your email and we&apos;ll send you a sign-in
              link. No password needed.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@work.com"
            />
            <button className="btn-primary" onClick={sendMagicLink} disabled={busy || !email}>
              {busy ? "Sending…" : "Send me a sign-in link"}
            </button>
          </>
        )}
        {error && <p className="error-msg">{error}</p>}
        <button className="close" onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
