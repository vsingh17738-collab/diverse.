"use client";

import { useMemo, useState } from "react";
import { cn, currency } from "@/lib/utils";

/* ------------------------------- area chart ------------------------------- */

export function AreaChart({
  data,
  height = 190,
  valueFormatter = (v: number) => currency(v),
  color = "#8b5cf6",
  id = "area",
}: {
  data: { label: string; value: number }[];
  height?: number;
  valueFormatter?: (v: number) => string;
  color?: string;
  id?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 720;
  const padY = 18;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: height - padY - (d.value / max) * (height - padY * 2),
  }));

  const line = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(" ");

  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-stroke`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2={width}
            y1={padY + (height - padY * 2) * (1 - f)}
            y2={padY + (height - padY * 2) * (1 - f)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={area} fill={`url(#${id}-fill)`} />
        <path
          d={line}
          fill="none"
          stroke={`url(#${id}-stroke)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {hover !== null && (
          <>
            <line
              x1={points[hover].x}
              x2={points[hover].x}
              y1={0}
              y2={height}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={points[hover].x} cy={points[hover].y} r="5" fill="#0b0b14" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </>
        )}
        {data.map((_, i) => (
          <rect
            key={i}
            x={i * stepX - stepX / 2}
            y={0}
            width={stepX}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-white/10 bg-[#151522] px-2.5 py-1.5 text-[11px] shadow-xl"
          style={{ left: `${(points[hover].x / width) * 100}%` }}
        >
          <span className="text-muted">{data[hover].label}</span>
          <span className="ml-2 font-semibold text-white">
            {valueFormatter(data[hover].value)}
          </span>
        </div>
      )}
      <div className="mt-2 flex justify-between px-0.5 text-[10px] font-medium text-white/30">
        {data.map((d, i) => (
          <span
            key={`${d.label}-${i}`}
            className={cn(
              i % 2 !== 0 && data.length > 8 && "hidden sm:inline",
              hover === i && "text-white/80",
            )}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- bar chart ------------------------------- */

export function BarChart({
  data,
  height = 150,
  suffix,
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  height?: number;
  suffix?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d) => {
        const h = Math.max(4, (d.value / max) * (height - 24));
        return (
          <div key={d.label} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
            <div className="pointer-events-none absolute -top-4 z-10 whitespace-nowrap rounded-md border border-white/10 bg-[#151522] px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {d.value}
              {suffix ? ` ${suffix}` : ""}
            </div>
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-all duration-300",
                d.highlight
                  ? "bg-gradient-to-t from-cyan/30 to-cyan"
                  : "bg-gradient-to-t from-violet/15 to-violet/70 group-hover:to-violet",
              )}
              style={{ height: h }}
            />
            <span className="text-[9px] font-medium text-white/30">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- donut ---------------------------------- */

export function Donut({
  segments,
  size = 148,
  thickness = 14,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const [hover, setHover] = useState<string | null>(null);

  const arcs = useMemo(() => {
    let offset = 0;
    return segments.map((s) => {
      const fraction = s.value / total;
      const arc = {
        ...s,
        dash: fraction * circumference,
        offset,
        pct: Math.round(fraction * 100),
      };
      offset += fraction * circumference;
      return arc;
    });
  }, [segments, total, circumference]);

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={thickness}
          />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={a.color}
              strokeWidth={hover === a.label ? thickness + 3 : thickness}
              strokeDasharray={`${a.dash} ${circumference - a.dash}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="round"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHover(a.label)}
              onMouseLeave={() => setHover(null)}
              opacity={hover && hover !== a.label ? 0.35 : 1}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tracking-tight text-white">
            {hover ? arcs.find((a) => a.label === hover)?.value : centerValue}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
            {hover ?? centerLabel}
          </span>
        </div>
      </div>
      <div className="flex min-w-[120px] flex-1 flex-col gap-2">
        {arcs.map((a) => (
          <div
            key={a.label}
            className={cn(
              "flex items-center justify-between gap-3 text-xs transition-opacity",
              hover && hover !== a.label && "opacity-40",
            )}
            onMouseEnter={() => setHover(a.label)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex items-center gap-2 text-white/65">
              <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
              {a.label}
            </span>
            <span className="font-semibold text-white/85">{a.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- sparkline ------------------------------- */

export function Sparkline({
  values,
  color = "#8b5cf6",
  width = 88,
  height = 30,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const path = values
    .map((v, i) => {
      const x = i * step;
      const y = height - 3 - ((v - min) / span) * (height - 6);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const gid = `spark-${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
