"use client";

import { useEffect, useState } from "react";

export default function AuthStatus() {
  const [me, setMe] = useState<{ email?: string; plan?: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.email ? d : null))
      .catch(() => setMe(null));
  }, []);

  if (!me?.email) return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.reload();
  }

  async function managePlan() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) location.href = data.url;
  }

  return (
    <span style={{ fontSize: 13, color: "var(--muted)", display: "inline-flex", gap: 10, alignItems: "center" }}>
      <span>
        {me.email} {me.plan === "pro" && <strong style={{ color: "var(--accent)" }}>PRO</strong>}
      </span>
      {me.plan === "pro" && (
        <button
          onClick={managePlan}
          style={{
            background: "none", border: "1px solid var(--border)", color: "var(--muted)",
            borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12,
          }}
        >
          Manage plan
        </button>
      )}
      <button
        onClick={logout}
        style={{
          background: "none", border: "1px solid var(--border)", color: "var(--muted)",
          borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontSize: 12,
        }}
      >
        Sign out
      </button>
    </span>
  );
}
