import React from "react";
import { cn } from "./cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-950/60 shadow-lg shadow-black/20",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("p-4 md:p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <div className={cn("text-lg font-extrabold text-slate-100", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return <div className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-4 md:p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("p-4 md:p-5 pt-0", className)} {...props} />;
}
