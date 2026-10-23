import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-panel-2/90 via-panel/60 to-panel/30 px-5 py-5 sm:px-6">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet/20 blur-[70px]" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-soft">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>
          )}
          {children}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`card overflow-hidden ${className ?? ""}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3.5 sm:px-5">
          <div>
            {title && (
              <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
            )}
            {subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
    </section>
  );
}
