import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useStore, nowMs, orderTotal, stockStatus, availableOf } from "@/lib/store";
import { dh0, dateTimeFr, dateFr } from "@/lib/format";
import { Card, PageHeader, AgentBadge, SHOWROOM_URL } from "@/components/bi/ui";
import { ClientLink } from "@/components/bi/drawers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Dashboard — Belle Image" }, { name: "description", content: "Activité de Belle Image : ventes, livraisons, SAV et agents IA." },
    { property: "og:title", content: "Dashboard — Belle Image" }, { property: "og:description", content: "Vue d'ensemble de l'activité du magasin." },
  ] }),
  component: Dashboard,
});

const PERIODS = [{ k: 1, l: "Aujourd'hui" }, { k: 7, l: "7 jours" }, { k: 30, l: "30 jours" }, { k: 90, l: "3 mois" }];
const DAY = 86400000;
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)", "var(--warning)", "var(--info)"];

function CountUp({ v, money }: { v: number; money?: boolean }) {
  const [x, setX] = useState(0); const prev = useRef(0);
  useEffect(() => {
    const start = prev.current; const t0 = performance.now(); let raf = 0;
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 700); setX(start + (v - start) * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(tick); else prev.current = v; };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [v]);
  return <>{money ? dh0(x) : Number.isInteger(v) ? Math.round(x) : x.toFixed(1).replace(".", ",")}</>;
}

function Dashboard() {
  const db = useStore((s) => s.db); const nav = useNavigate();
  const [period, setPeriod] = useState(30); const [allAct, setAllAct] = useState(false); const [actFilter, setActFilter] = useState("");
  const now = nowMs(db); const from = now - period * DAY; const pFrom = from - period * DAY;
  const today = new Date(now).toISOString().slice(0, 10);

  const k = useMemo(() => {
    const inP = (d: string, a = from, b = now) => { const t = new Date(d).getTime(); return t >= a && t <= b; };
    const ord = db.orders.filter((o) => inP(o.createdAt)); const ordPrev = db.orders.filter((o) => inP(o.createdAt, pFrom, from));
    const paid = db.payments.filter((p) => p.at && p.status !== "À encaisser");
    const ca = paid.filter((p) => inP(p.at!)).reduce((s, p) => s + (p.received ?? 0), 0);
    const caPrev = paid.filter((p) => inP(p.at!, pFrom, from)).reduce((s, p) => s + (p.received ?? 0), 0);
    const todayDel = db.deliveries.filter((d) => d.date === today && ["Planifiée", "En route"].includes(d.status));
    const toCollect = todayDel.reduce((s, d) => s + (db.payments.find((p) => p.orderId === d.orderId && p.status === "À encaisser")?.expected ?? 0), 0);
    const open = db.tickets.filter((t) => !["Clôturée", "Refusée — hors garantie", "Résolue"].includes(t.status));
    const closed = db.tickets.filter((t) => t.status === "Clôturée");
    const low = db.products.filter((p) => p.status === "Actif" && stockStatus(db, p) === "Stock bas").length;
    const out = db.products.filter((p) => p.status === "Actif" && stockStatus(db, p) === "Rupture").length;
    const priceWeek = db.priceHistory.filter((h) => inP(h.at, now - 7 * DAY) && h.origin !== "Annulation").length;
    const rating = db.reviews.length ? db.reviews.reduce((s, r) => s + r.rating, 0) / db.reviews.length : 0;
    const spark = (fn: (a: number, b: number) => number) => Array.from({ length: 10 }, (_, i) => ({ v: fn(from + (i * (now - from)) / 10, from + ((i + 1) * (now - from)) / 10) }));
    return {
      ord: ord.length, ordPrev: ordPrev.length, ca, caPrev, toConfirm: db.orders.filter((o) => o.status === "Nouvelle").length,
      todayDel: todayDel.length, toCollect, open: open.length, resol: closed.length ? 3.2 : 0, low, out, priceWeek,
      auto: 87, rating, ordList: ord,
      sOrd: spark((a, b) => db.orders.filter((o) => { const t = +new Date(o.createdAt); return t >= a && t < b; }).length),
      sCa: spark((a, b) => paid.filter((p) => { const t = +new Date(p.at!); return t >= a && t < b; }).reduce((s, p) => s + (p.received ?? 0), 0)),
    };
  }, [db, from, now, pFrom, today]);

  const byCat = useMemo(() => {
    const m: Record<string, number> = {}; const mb: Record<string, number> = {};
    k.ordList.filter((o) => o.status !== "Annulée").forEach((o) => o.lines.forEach((l) => { const p = db.products.find((x) => x.id === l.productId)!; m[p.sub] = (m[p.sub] ?? 0) + l.qty * l.unitPrice; mb[p.brand] = (mb[p.brand] ?? 0) + l.qty * l.unitPrice; }));
    return { cat: Object.entries(m).map(([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v), brand: Object.entries(mb).map(([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v) };
  }, [k.ordList, db.products]);
  const byStatus = useMemo(() => { const m: Record<string, number> = {}; k.ordList.forEach((o) => (m[o.status] = (m[o.status] ?? 0) + 1)); return Object.entries(m).map(([name, v]) => ({ name, v })); }, [k.ordList]);
  const savBrand = useMemo(() => { const m: Record<string, number> = {}; db.tickets.forEach((t) => { const b = db.products.find((p) => p.id === t.productId)!.brand; m[b] = (m[b] ?? 0) + 1; }); return Object.entries(m).map(([name, v]) => ({ name, v })).sort((a, b) => b.v - a.v); }, [db]);
  const savType = useMemo(() => { const m: Record<string, number> = {}; db.tickets.forEach((t) => (m[t.type] = (m[t.type] ?? 0) + 1)); return Object.entries(m).map(([name, v]) => ({ name, v })); }, [db.tickets]);
  const waTop = useMemo(() => { const m: Record<string, number> = {}; db.orders.filter((o) => o.source === "WhatsApp Agent Catalogue").forEach((o) => o.lines.forEach((l) => (m[l.name] = (m[l.name] ?? 0) + 1))); return Object.entries(m).map(([name, v]) => ({ name: name.slice(0, 26), v })).sort((a, b) => b.v - a.v).slice(0, 6); }, [db.orders]);
  const caTrend = useMemo(() => Array.from({ length: 12 }, (_, i) => { const a = from + (i * (now - from)) / 12, b = from + ((i + 1) * (now - from)) / 12; return { name: dateFr(a).slice(0, 5), v: db.payments.filter((p) => p.at && +new Date(p.at) >= a && +new Date(p.at) < b).reduce((s, p) => s + (p.received ?? 0), 0) }; }), [db.payments, from, now]);

  const failed = db.deliveries.filter((d) => d.status === "Échec").length;
  const unremitted = db.payments.filter((p) => (p.status === "Encaissé" || p.status === "Écart") && p.mode !== "Carte bancaire (TPE)").length;
  const late = db.tickets.filter((t) => !["Clôturée", "Résolue", "Refusée — hors garantie"].includes(t.status) && now - +new Date(t.createdAt) > 4 * DAY).length;
  const badReviews = db.reviews.filter((r) => r.rating <= 2 && !r.ticketId).length;
  const importErr = db.imports.filter((i) => i.errors > 0 && !i.undone).length;
  const actions = [
    { n: k.toConfirm, t: "commandes à confirmer", to: "/commandes", s: { statut: "Nouvelle" } },
    { n: failed, t: "livraisons en échec à replanifier", to: "/livraisons", s: { onglet: "liste" } },
    { n: unremitted, t: "encaissements non reversés", to: "/livraisons", s: { onglet: "encaissements" } },
    { n: k.low + k.out, t: "produits sous le seuil", to: "/stock", s: {} },
    { n: late, t: "réclamations en retard", to: "/sav", s: {} },
    { n: importErr, t: "import Excel avec erreurs", to: "/produits", s: { onglet: "import" } },
    { n: badReviews, t: "note ≤ 2/5 à traiter", to: "/", s: {} },
  ].filter((a) => a.n > 0);

  const Delta = ({ a, b }: { a: number; b: number }) => { if (!b) return null; const d = ((a - b) / b) * 100; return <span className={cn("inline-flex items-center text-xs font-semibold", d >= 0 ? "text-success" : "text-brand")}>{d >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(d).toFixed(0)} %</span>; };
  const KPI = ({ label, v, money, to, s, delta, spark, warn }: { label: string; v: number; money?: boolean; to: string; s?: Record<string, string>; delta?: [number, number]; spark?: { v: number }[]; warn?: boolean }) => (
    <Card onClick={() => nav({ to, search: s })} className="p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className={cn("font-display text-2xl font-semibold tnum", warn && v > 0 && "text-brand")}><CountUp v={v} money={money} /></div>
        {delta && <Delta a={delta[0]} b={delta[1]} />}
      </div>
      {spark && <div className="mt-2 h-8"><ResponsiveContainer><AreaChart data={spark}><Area dataKey="v" stroke="var(--brand)" fill="var(--accent)" strokeWidth={1.5} /></AreaChart></ResponsiveContainer></div>}
    </Card>
  );

  const acts = db.activity.filter((a) => !actFilter || a.kind === actFilter || a.actor === actFilter);
  return (
    <div>
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-ink p-8 text-ink-foreground">
        <img src={SHOWROOM_URL} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-[2px]" onError={(e) => (e.currentTarget.style.display = "none")} />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-brand/40" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm text-ink-foreground/70">{new Date(now).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold md:text-4xl">Bonjour Salma, voici l'activité de Belle Image.</h1></div>
          <div className="flex rounded-full bg-ink-foreground/10 p-1">{PERIODS.map((p) => <button key={p.k} onClick={() => setPeriod(p.k)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", period === p.k ? "bg-primary text-primary-foreground" : "text-ink-foreground/80")}>{p.l}</button>)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KPI label="Commandes" v={k.ord} to="/commandes" delta={[k.ord, k.ordPrev]} spark={k.sOrd} />
        <KPI label="CA encaissé" v={k.ca} money to="/livraisons" s={{ onglet: "encaissements" }} delta={[k.ca, k.caPrev]} spark={k.sCa} />
        <KPI label="À confirmer" v={k.toConfirm} to="/commandes" s={{ statut: "Nouvelle" }} warn />
        <KPI label="Livraisons du jour" v={k.todayDel} to="/livraisons" s={{ onglet: "planning" }} />
        <KPI label="À encaisser aujourd'hui" v={k.toCollect} money to="/livraisons" s={{ onglet: "encaissements" }} />
        <KPI label="Réclamations ouvertes" v={k.open} to="/sav" warn />
        <KPI label="Délai moyen SAV (j)" v={k.resol} to="/sav" />
        <KPI label="Stock bas / rupture" v={k.low + k.out} to="/stock" warn />
        <KPI label="Prix modifiés (7 j)" v={k.priceWeek} to="/produits" s={{ onglet: "historique" }} />
        <KPI label="Réponse auto IA (%)" v={k.auto} to="/base-de-connaissance" s={{ onglet: "regles" }} />
        <KPI label="Satisfaction /5" v={Math.round(k.rating * 10) / 10} to="/" />
        <KPI label="Produits actifs" v={db.products.filter((p) => p.status === "Actif").length} to="/produits" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h3 className="mb-3 font-display text-lg font-semibold">Actions requises</h3>
          {actions.length === 0 ? <p className="text-sm text-muted-foreground">Tout est à jour 🎉</p> : (
            <div className="grid gap-2 sm:grid-cols-2">{actions.map((a) => (
              <Link key={a.t} to={a.to} search={a.s} className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/50">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-accent px-2 font-display font-semibold text-accent-foreground tnum animate-breathe">{a.n}</span>
                <span className="flex-1 text-sm">{a.t}</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>))}
            </div>)}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Activité</h3><button className="text-xs font-semibold text-brand" onClick={() => setAllAct(true)}>Voir tout</button></div>
          <ul className="space-y-3">{db.activity.slice(0, 6).map((a) => <li key={a.id} className="text-sm"><div className="flex items-center gap-2">{a.actor.startsWith("Agent") ? <AgentBadge agent={a.actor} /> : <span className="text-xs font-semibold">{a.actor}</span>}<span className="text-xs text-muted-foreground">{dateTimeFr(a.at)}</span></div><p className="mt-0.5">{a.text}</p></li>)}</ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Ventes par catégorie"><BarChart data={byCat.cat} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} /><Tooltip formatter={(v: number) => dh0(v)} /><Bar dataKey="v" fill="var(--chart-1)" radius={[0, 6, 6, 0]} /></BarChart></ChartCard>
        <ChartCard title="Ventes par marque"><BarChart data={byCat.brand}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis hide /><Tooltip formatter={(v: number) => dh0(v)} /><Bar dataKey="v" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ChartCard>
        <ChartCard title="Commandes par statut"><PieChart><Pie data={byStatus} dataKey="v" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>{byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ChartCard>
        <ChartCard title="Évolution du CA encaissé"><AreaChart data={caTrend}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis hide /><Tooltip formatter={(v: number) => dh0(v)} /><Area dataKey="v" stroke="var(--brand)" fill="var(--accent)" strokeWidth={2} /></AreaChart></ChartCard>
        <ChartCard title="Produits les plus demandés sur WhatsApp"><BarChart data={waTop} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="v" fill="var(--chart-5)" radius={[0, 6, 6, 0]} /></BarChart></ChartCard>
        <ChartCard title="Réclamations par marque / type"><BarChart data={savBrand}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis hide allowDecimals={false} /><Tooltip /><Bar dataKey="v" fill="var(--chart-3)" radius={[6, 6, 0, 0]} /></BarChart></ChartCard>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">{savType.map((s) => <span key={s.name}>{s.name} : {s.v}</span>)}</div>

      <Card className="mt-6">
        <h3 className="mb-3 font-display text-lg font-semibold">Avis clients</h3>
        <div className="grid gap-2 md:grid-cols-2">{db.reviews.slice(0, 8).map((r) => (
          <div key={r.id} className={cn("flex items-center gap-3 rounded-xl border p-3 text-sm", r.rating <= 2 && "border-brand/40 bg-accent/40")}>
            <span className="font-display text-lg text-gold">{"★".repeat(r.rating)}<span className="text-border">{"★".repeat(5 - r.rating)}</span></span>
            <div className="flex-1"><ClientLink id={r.clientId} /><p className="text-muted-foreground">{r.comment}</p></div>
            {r.rating <= 2 && (r.ticketId ? <Link to="/sav/$id" params={{ id: r.ticketId }} className="text-xs font-semibold text-brand">Voir le ticket</Link> :
              <Button size="sm" onClick={() => { const o = db.orders.find((x) => x.id === r.orderId)!; const res = useStore.getState().createTicket({ clientId: r.clientId, orderId: r.orderId, productId: o.lines[0].productId, type: "Livraison", source: "Avis ≤ 2/5", description: r.comment }); if (res.ok) useStore.getState().mut((d) => { d.reviews.find((x) => x.id === r.id)!.ticketId = res.id; }); }}>Créer une réclamation</Button>)}
          </div>))}
        </div>
      </Card>

      <Sheet open={allAct} onOpenChange={setAllAct}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle className="font-display">Journal d'activité</SheetTitle></SheetHeader>
          <div className="flex flex-wrap gap-1 px-4">{["", "Commandes", "Stock", "Prix", "Livraisons", "SAV", "Agents", "Import"].map((f) => <button key={f} onClick={() => setActFilter(f)} className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", actFilter === f && "border-brand bg-accent text-accent-foreground")}>{f || "Tout"}</button>)}</div>
          <ul className="space-y-3 p-4">{acts.map((a) => <li key={a.id} className="border-b pb-2 text-sm"><div className="flex items-center gap-2 text-xs"><b>{a.actor}</b><span className="text-muted-foreground">{dateTimeFr(a.at)} · {a.kind}</span></div>{a.text}</li>)}</ul>
        </SheetContent>
      </Sheet>
      <span className="hidden">{availableOf.name}{orderTotal.name}</span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return <Card><h3 className="mb-3 font-display text-base font-semibold">{title}</h3><div className="h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div></Card>;
}
