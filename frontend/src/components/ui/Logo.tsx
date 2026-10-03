"use client";
import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="logo-editorial" aria-label="TruthHubBD home">
      <span
        style={{
          background: "var(--ink)",
          color: "#fff",
          padding: "5px",
          borderRadius: "5px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "6px",
        }}
      >
        <ShieldCheck size={18} strokeWidth={2.4} />
      </span>
      <span style={{ fontFamily: 'var(--serif)', fontSize: '23px', fontWeight: 700, color: dark ? '#FFFFFF' : 'var(--ink)' }}>
        Truth<b style={{ color: dark ? '#EF4444' : 'var(--verm)' }}>Hub</b>BD
      </span>
    </Link>
  );
}

