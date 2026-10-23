"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  hint,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="ml-1 text-violet">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/30">{hint}</p>}
    </div>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("input", className)} {...props} />;
});

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("select", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input min-h-[84px] resize-y", className)} {...props} />;
}
