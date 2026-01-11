import React from "react";
import { cn } from "./cn";

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 " +
          "text-sm text-slate-100 placeholder:text-slate-500 " +
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
        className
      )}
      {...props}
    />
  );
}
