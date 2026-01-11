import React from "react";

const VARIANTS = {
  success: "border-emerald-700/40 bg-emerald-950/40 text-emerald-200",
  info: "border-blue-700/40 bg-blue-950/40 text-blue-200",
  warn: "border-amber-700/40 bg-amber-950/40 text-amber-200",
  danger: "border-red-900/50 bg-red-950/35 text-red-200",
  purple: "border-purple-700/40 bg-purple-950/40 text-purple-200",
  neutral: "border-slate-700 bg-slate-900/50 text-slate-200",
};

export default function Badge({ children, variant = "neutral", className = "" }) {
  const cls = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls} ${className}`}>
      {children}
    </span>
  );
}
