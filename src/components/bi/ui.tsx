import { useState, type ReactNode } from "react";
import {
  Refrigerator, WashingMachine, CookingPot, Tv, AirVent, Blend, Sofa, BedDouble, UtensilsCrossed, Archive,
  CircleDot, CheckCircle2, Package, PackageCheck, Truck, BadgeCheck, XCircle, Undo2, Clock, AlertTriangle, Wrench, CalendarClock, Lock, Banknote, Ban, Bot,
} from "lucide-react";
import type { Product, Sub } from "@/lib/types";
import logoAsset from "@/assets/belle-image-logo.png.asset.json";
import { cn } from "@/lib/utils";

export const LOGO_URL = logoAsset.url;
export const SHOWROOM_URL = "https://belleimage.izemxlab.com/assets/showroom-1-DppMc5qv.png";

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  const [err, setErr] = useState(false);
  return <div className={cn("flex shrink-0 items-center justify-center rounded-xl bg-card p-2", light && "mx-auto", className)}>
    {err ? <span className="text-sm text-muted-foreground">Logo indisponible</span> : <img src={LOGO_URL} alt="Belle Image — أحسن صورة" className="h-28 w-28 object-contain" onError={() => setErr(true)} />}
  </div>;
}

const SUB_ICON: Record<Sub, typeof Tv> = {
  "Réfrigérateurs": Refrigerator, "Lave-linge": WashingMachine, "Cuisson": CookingPot, "TV & image": Tv, "Climatisation": AirVent,
  "Petit électroménager": Blend, "Salons": Sofa, "Chambres": BedDouble, "Salles à manger": UtensilsCrossed, "Rangement": Archive,
};

export function ProductThumb({ p, className, square }: { p: Product; className?: string; square?: boolean }) {
  const srcs = [`/products/${p.ref.toLowerCase()}.jpg`, p.imageUrl].filter(Boolean) as string[];
  const [i, setI] = useState(0);
  const Icon = SUB_ICON[p.sub];
  const fallback = i >= srcs.length;
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-accent", square ? "aspect-square" : "aspect-[4/3]", className)}>
      {!fallback ? (
        <img src={srcs[i]} alt={p.name} loading="lazy" className="h-full w-full object-cover" onError={() => setI(i + 1)} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-brand/70">
          <Icon strokeWidth={1.25} className="h-1/2 w-1/2 max-h-16 max-w-16" />
          {!square && <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold tracking-wide text-foreground/70">{p.brand}</span>}
        </div>
      )}
    </div>
  );
}

type Tone = "brand" | "success" | "warning" | "info" | "muted" | "ink" | "gold";
const TONES: Record<Tone, string> = {
  brand: "bg-accent text-accent-foreground border-brand/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/25",
  info: "bg-info/10 text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
  ink: "bg-ink text-ink-foreground border-ink",
  gold: "bg-gold/10 text-gold border-gold/30",
};
const STATUS: Record<string, [Tone, typeof Tv]> = {
  "Nouvelle": ["brand", CircleDot], "Confirmée": ["info", CheckCircle2], "En préparation": ["warning", Package], "Prête": ["info", PackageCheck],
  "En livraison": ["warning", Truck], "Livrée & encaissée": ["success", BadgeCheck], "Annulée": ["muted", XCircle], "Retournée": ["muted", Undo2],
  "À planifier": ["muted", Clock], "Planifiée": ["info", CalendarClock], "En route": ["warning", Truck], "Livrée": ["success", BadgeCheck], "Échec": ["brand", AlertTriangle], "Reportée": ["muted", Clock],
  "À encaisser": ["warning", Banknote], "Encaissé": ["success", CheckCircle2], "Écart": ["brand", AlertTriangle], "Reversé": ["ink", Lock],
  "En analyse": ["info", Clock], "Technicien assigné": ["warning", Wrench], "Intervention planifiée": ["info", CalendarClock], "Résolue": ["success", CheckCircle2], "Clôturée": ["muted", Lock], "Refusée — hors garantie": ["muted", Ban],
  "En stock": ["success", CheckCircle2], "Stock bas": ["warning", AlertTriangle], "Rupture": ["brand", XCircle],
  "Actif": ["success", CheckCircle2], "Brouillon": ["muted", Clock], "Archivé": ["muted", Archive],
  "Prêt": ["success", CheckCircle2], "Sans changement": ["muted", CircleDot], "Variation forte": ["warning", AlertTriangle], "Erreur": ["brand", XCircle],
};
export function StatusBadge({ s, pulse }: { s: string; pulse?: boolean }) {
  const [tone, Icon] = STATUS[s] ?? ["muted", CircleDot];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold", TONES[tone], pulse && "animate-breathe")}>
      <Icon className="h-3 w-3" /> {s}
    </span>
  );
}
export function Pill({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold", TONES[tone], className)}>{children}</span>;
}
export function SourceBadge({ source }: { source: string }) {
  return <Pill tone="brand" className="shadow-[0_0_12px_-2px_var(--brand)]">{source}</Pill>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">{title}</h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-brand" />
        {subtitle && <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={cn("rounded-2xl border bg-card p-5 shadow-soft", onClick && "card-lift cursor-pointer", className)}>{children}</div>;
}
export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { v: T; label: string; count?: number }[] }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b">
      {items.map((it) => (
        <button key={it.v} onClick={() => onChange(it.v)} className={cn("relative -mb-px px-4 py-2.5 text-sm font-semibold transition-colors", value === it.v ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {it.label}{it.count != null && <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">{it.count}</span>}
          {value === it.v && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand" />}
        </button>
      ))}
    </div>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
      <Sofa className="h-10 w-10 text-brand/40" strokeWidth={1.2} />{text}
    </div>
  );
}
export function StockBar({ value, max }: { value: number; max: number }) {
  const w = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  return <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full transition-all duration-700", value <= 0 ? "bg-brand" : w < 30 ? "bg-warning" : "bg-success")} style={{ width: `${w}%` }} /></div>;
}
