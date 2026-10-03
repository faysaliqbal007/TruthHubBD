"use client";
import React from "react";
import { ShieldCheck } from "lucide-react";

export function DemoNotice() {
  return (
    <div className="demo-notice">
      <ShieldCheck size={17} />
      <span>
        TruthHubBD moderation preview: nationwide verified profiles and evidence-backed scam records.
      </span>
    </div>
  );
}
