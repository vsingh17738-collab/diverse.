import { CircuitBoard, Gamepad2, ShieldCheck, Sparkles, Trophy } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden border-r border-white/[0.06] bg-[#08080f] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-violet/[0.16] blur-[110px]" />
        <div className="absolute -bottom-24 right-0 h-[380px] w-[380px] rounded-full bg-cyan/[0.10] blur-[110px]" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-[#5b21b6] shadow-[0_10px_30px_-8px_rgba(139,92,246,0.9)]">
            <CircuitBoard className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-lg font-bold leading-none tracking-tight text-white">NEXUS</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-soft/70">
              Gaming Zone OS
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet/25 bg-violet/10 px-3 py-1 text-[11px] font-semibold text-violet-soft">
            <Sparkles className="h-3 w-3" />
            18 stations · 26 members · 4 live brackets
          </div>
          <h1 className="text-[40px] font-bold leading-[1.08] tracking-tight text-white">
            Run the floor.
            <br />
            <span className="bg-gradient-to-r from-violet-soft via-cyan to-lime bg-clip-text text-transparent">
              Own the night.
            </span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            The complete control room for your gaming zone — live station status,
            bookings, wallets, tournaments and revenue, all in one polished dashboard.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { icon: Gamepad2, title: "Station control", detail: "Real-time availability" },
              { icon: Trophy, title: "Tournaments", detail: "Brackets & prize pools" },
              { icon: ShieldCheck, title: "Role access", detail: "Owner, manager, staff" },
              { icon: Sparkles, title: "Live insights", detail: "Revenue & peak hours" },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 backdrop-blur-sm"
              >
                <f.icon className="mb-2 h-4 w-4 text-violet-soft" />
                <p className="text-[12px] font-semibold text-white/85">{f.title}</p>
                <p className="mt-0.5 text-[11px] text-white/35">{f.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-[11px] text-white/30">
          <span className="flex items-center gap-1.5">
            <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-lime" />
            18 stations online
          </span>
          <span>Peak: 6–10pm</span>
          <span>v2.6.0</span>
        </div>
      </div>

      {/* form panel */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[500px] -translate-x-1/2 rounded-full bg-violet/[0.10] blur-[90px] lg:hidden" />
        <div className="relative w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
