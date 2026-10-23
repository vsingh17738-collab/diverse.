import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  color = "#8b5cf6",
  size = "md",
  className,
  ring,
}: {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  ring?: boolean;
}) {
  const sizes = {
    xs: "h-6 w-6 text-[9px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide text-white",
        sizes[size],
        ring && "ring-2 ring-base",
        className,
      )}
      style={{
        background: `linear-gradient(140deg, ${color}, ${color}66)`,
        boxShadow: `inset 0 0 0 1px ${color}40`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
