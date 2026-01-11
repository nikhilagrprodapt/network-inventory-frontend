import React from "react";
import { cn } from "./cn";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
  "transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-500 border border-blue-500/40",
  secondary: "bg-slate-900 text-slate-100 hover:bg-slate-800 border border-slate-700",
  ghost: "bg-transparent text-slate-100 hover:bg-white/5 border border-transparent",
  danger: "bg-red-600 text-white hover:bg-red-500 border border-red-500/40",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-2.5 text-base rounded-2xl",
};

export default function Button({
  className,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
