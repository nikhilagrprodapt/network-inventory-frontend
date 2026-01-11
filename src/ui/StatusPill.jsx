import React from "react";

const STATUS_STYLES = {
  ACTIVE: "border-emerald-700/40 bg-emerald-950/40 text-emerald-200",
  DISCONNECTED: "border-red-900/50 bg-red-950/35 text-red-200",
  PENDING: "border-amber-700/40 bg-amber-950/40 text-amber-200",
  INACTIVE: "border-slate-700 bg-slate-900/50 text-slate-200",
};

const DOT_STYLES = {
  ACTIVE: "bg-emerald-500",
  DISCONNECTED: "bg-red-500",
  PENDING: "bg-amber-500",
  INACTIVE: "bg-slate-400",
};

export default function StatusPill({ status }) {
  const v = String(status ?? "INACTIVE").toUpperCase();
  const pill = STATUS_STYLES[v] || "border-slate-700 bg-slate-900/50 text-slate-200";
  const dot = DOT_STYLES[v] || "bg-slate-400";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${pill}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      {v}
    </span>
  );
}
