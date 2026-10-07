import { Refrigerator, Sofa, Tv, WashingMachine, BedDouble, Lamp, AirVent, MessageCircle, Truck } from "lucide-react";

const ICONS = [Refrigerator, Sofa, Tv, WashingMachine, BedDouble, Lamp, AirVent];

export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(30deg,var(--color-border)_1px,transparent_1px),linear-gradient(150deg,var(--color-border)_1px,transparent_1px)] [background-size:56px_32px]" />
      {ICONS.map((I, i) => (
        <I key={i} strokeWidth={0.8} className="absolute animate-drift text-foreground opacity-[0.035]"
          style={{ left: `${10 + ((i * 37) % 85)}%`, top: `${8 + ((i * 53) % 80)}%`, width: 90 + (i % 3) * 30, height: 90 + (i % 3) * 30, animationDelay: `${-i * 6}s` }} />
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="absolute h-1 w-1 animate-floaty rounded-full bg-gold/40" style={{ left: `${(i * 61) % 100}%`, top: `${(i * 29) % 100}%`, animationDelay: `${-i}s` }} />
      ))}
    </div>
  );
}

const PIECES = [
  { I: Sofa, x: 18, y: 58, s: 120 }, { I: Lamp, x: 8, y: 30, s: 80 }, { I: Tv, x: 44, y: 34, s: 110 },
  { I: Refrigerator, x: 70, y: 40, s: 120 }, { I: WashingMachine, x: 60, y: 66, s: 90 }, { I: BedDouble, x: 34, y: 72, s: 100 },
];

export function ShowroomScene() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-gradient-login">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(30deg,oklch(0.19_0.015_0/0.08)_1px,transparent_1px),linear-gradient(150deg,oklch(0.19_0.015_0/0.08)_1px,transparent_1px)] [background-size:64px_36px]" />
      <svg viewBox="0 0 600 520" className="absolute left-1/2 top-[46%] w-[80%] max-w-[640px] -translate-x-1/2 -translate-y-1/2">
        <path d="M60 500 L60 220 L300 40 L540 220 L540 500" fill="oklch(1 0 0 / 0.08)" stroke="var(--brand)" strokeWidth="2" className="animate-draw" />
        <path d="M100 500 L100 240 L300 90 L500 240 L500 500" fill="none" stroke="oklch(1 0 0 / 0.5)" strokeWidth="1" />
        <path id="route" d="M20 470 C 160 380, 260 520, 380 430 S 560 380, 600 300" fill="none" stroke="var(--brand)" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
      </svg>
      <div className="absolute left-1/2 top-[46%] h-[70%] w-[80%] max-w-[640px] -translate-x-1/2 -translate-y-1/2">
        {PIECES.map(({ I, x, y, s }, i) => (
          <div key={i} className="absolute animate-floaty" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * 1.3}s` }}>
            <I strokeWidth={0.9} style={{ width: s, height: s }} className="text-ink/70 drop-shadow-[0_0_14px_oklch(1_0_0/0.7)]" />
          </div>
        ))}
        {["5 990 DH", "-15 %", "4 290 DH"].map((t, i) => (
          <div key={t} className="absolute origin-top animate-floaty rounded-md border border-brand/40 bg-card/90 px-2 py-1 font-display text-sm font-semibold text-brand shadow-soft" style={{ left: `${22 + i * 28}%`, top: `${14 + (i % 2) * 14}%`, animationDelay: `${-i * 2}s` }}>{t}</div>
        ))}
      </div>
      <div className="absolute bottom-[12%] left-0 right-0 h-8"><Truck className="absolute h-8 w-8 animate-travel text-brand" /></div>
      {Array.from({ length: 6 }).map((_, i) => (
        <MessageCircle key={i} className="absolute bottom-0 h-7 w-7 animate-rise text-success/60" style={{ left: `${10 + i * 15}%`, animationDelay: `${-i * 1.6}s` }} />
      ))}
      <div className="absolute inset-y-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-card/25 to-transparent" />
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="absolute h-1 w-1 animate-floaty rounded-full bg-gold/60" style={{ left: `${(i * 41) % 100}%`, top: `${(i * 23) % 100}%`, animationDelay: `${-i * 0.5}s` }} />
      ))}
    </div>
  );
}
