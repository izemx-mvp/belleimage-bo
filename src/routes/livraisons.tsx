import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Map, FileText, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore, nowMs, orderTotal } from "@/lib/store";
import type { Slot, Delivery } from "@/lib/types";
import { dh, dayFr, dateTimeFr } from "@/lib/format";
import { orderPdf, simplePdf } from "@/lib/pdf";
import { DataTable } from "@/components/bi/DataTable";
import { PageHeader, StatusBadge, Tabs, Card, Pill } from "@/components/bi/ui";
import { ClientLink } from "@/components/bi/drawers";
import { CollectDialog, PlanDialog } from "@/components/bi/delivery-dialogs";
import { cn } from "@/lib/utils";

type Tab = "planning" | "liste" | "encaissements" | "livreurs";
export const Route = createFileRoute("/livraisons")({
  validateSearch: (s: Record<string, unknown>) => ({ onglet: (s.onglet as Tab) || undefined }),
  head: () => ({ meta: [{ title: "Livraisons — Belle Image" }, { name: "description", content: "Planning, tournées et encaissements à la livraison." }, { property: "og:title", content: "Livraisons — Belle Image" }, { property: "og:description", content: "Livraisons et paiement à la livraison." }] }),
  component: Deliveries,
});
const SLOTS: Slot[] = ["Matin", "Après-midi", "Soir"];
const SLOT_H: Record<Slot, string> = { Matin: "09:00–13:00", "Après-midi": "13:00–18:00", Soir: "18:00–21:00" };

function Deliveries() {
  const s = Route.useSearch(); const nav = useNavigate({ from: "/livraisons" }); const tab = s.onglet ?? "planning";
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <PageHeader title="Livraisons" subtitle="Paiement uniquement à la livraison, à la remise de la marchandise." />
      <Tabs value={tab} onChange={(v) => nav({ search: { onglet: v } })} items={[{ v: "planning", label: "Planning" }, { v: "liste", label: "Liste" }, { v: "encaissements", label: "Encaissements" }, { v: "livreurs", label: "Livreurs & zones" }]} />
      {tab === "planning" && <Planning onOpen={setOpen} />}
      {tab === "liste" && <List onOpen={setOpen} />}
      {tab === "encaissements" && <Cash />}
      {tab === "livreurs" && <Drivers />}
      <DeliverySheet id={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Planning({ onOpen }: { onOpen: (id: string) => void }) {
  const db = useStore((s) => s.db); const move = useStore((s) => s.moveDelivery); const plan = useStore((s) => s.planDelivery);
  const [off, setOff] = useState(0);
  const day = new Date(nowMs(db) + off * 86400000).toISOString().slice(0, 10);
  const toPlan = db.orders.filter((o) => ["Confirmée", "En préparation", "Prête"].includes(o.status) && o.mode === "Livraison à domicile" && !db.deliveries.some((d) => d.orderId === o.id && ["Planifiée", "En route"].includes(d.status)));
  const dayDel = db.deliveries.filter((d) => d.date === day && d.status !== "Reportée");
  const drop = (e: React.DragEvent, slot: Slot, drv: string) => {
    const [kind, id] = e.dataTransfer.getData("x").split(":");
    const r = kind === "d" ? move(id, day, slot, drv) : plan(id, day, slot, drv);
    r.ok ? toast.success(`${r.msg} — message au client proposé`) : toast.error(r.error);
  };
  const stops = dayDel.filter((d) => d.status !== "Échec").map((d) => db.clients.find((c) => c.id === db.orders.find((o) => o.id === d.orderId)!.clientId)!);
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
      <div>
        <div className="mb-3 flex items-center gap-2"><Button size="icon" variant="outline" onClick={() => setOff(off - 1)} aria-label="Jour précédent"><ChevronLeft className="h-4 w-4" /></Button><b className="font-display text-lg">{new Date(day).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</b><Button size="icon" variant="outline" onClick={() => setOff(off + 1)} aria-label="Jour suivant"><ChevronRight className="h-4 w-4" /></Button>{off !== 0 && <Button size="sm" variant="ghost" onClick={() => setOff(0)}>Aujourd'hui</Button>}</div>
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
          <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `110px repeat(${db.drivers.length}, 1fr)` }}>
            <div />{db.drivers.map((d) => <div key={d.id} className="border-b border-l p-2 text-sm font-semibold">{d.name}<div className="text-xs font-normal text-muted-foreground">{d.status}</div></div>)}
            {SLOTS.map((sl) => [
              <div key={sl} className="border-b p-2 text-xs font-semibold">{sl}<div className="text-muted-foreground">{SLOT_H[sl]}</div></div>,
              ...db.drivers.map((dr) => {
                const cell = dayDel.filter((d) => d.slot === sl && d.driverId === dr.id);
                return (
                  <div key={sl + dr.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e, sl, dr.id)} className="min-h-24 space-y-1 border-b border-l p-1.5">
                    {cell.map((d) => { const o = db.orders.find((x) => x.id === d.orderId)!; const c = db.clients.find((x) => x.id === o.clientId)!; return (
                      <div key={d.id} draggable onDragStart={(e) => e.dataTransfer.setData("x", `d:${d.id}`)} onClick={() => onOpen(d.id)} className={cn("cursor-grab rounded-lg border p-1.5 text-xs shadow-soft card-lift", d.status === "En route" ? "border-warning/40 bg-warning/5" : d.status === "Échec" ? "border-brand/30 bg-accent/40" : d.status === "Livrée" ? "bg-success/5" : "bg-card")}>
                        <div className="flex justify-between"><b>{o.num.slice(-4)}</b>{d.status === "En route" && <Truck className="h-3 w-3 text-warning" />}</div><div className="truncate">{c.name}</div><div className="truncate text-muted-foreground">{c.quartier}</div>
                      </div>); })}
                    <div className="text-right text-[10px] text-muted-foreground">{cell.filter((d) => !["Échec", "Livrée"].includes(d.status)).length}/{db.settings.capacity}</div>
                  </div>);
              }),
            ])}
          </div>
        </div>
        <Card className="mt-4"><h3 className="mb-2 font-display font-semibold">Tournée du jour</h3>
          <svg viewBox="0 0 600 140" className="w-full"><path d={`M20 110 ${stops.map((_, i) => `L ${60 + i * (520 / Math.max(stops.length, 1))} ${40 + ((i * 37) % 70)}`).join(" ")}`} stroke="var(--brand)" strokeWidth="2.5" fill="none" strokeDasharray="6 4" />
            <circle cx="20" cy="110" r="7" fill="var(--ink)" />{stops.map((c, i) => { const x = 60 + i * (520 / Math.max(stops.length, 1)), y = 40 + ((i * 37) % 70); return <g key={i}><circle cx={x} cy={y} r="11" fill="var(--brand)" /><text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill="white" fontWeight="700">{i + 1}</text><text x={x} y={y + 26} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{c.quartier}</text></g>; })}</svg>
        </Card>
      </div>
      <Card className="h-fit"><h3 className="mb-2 font-display font-semibold">À planifier ({toPlan.length})</h3><p className="mb-2 text-xs text-muted-foreground">Glissez une commande sur le calendrier.</p>
        <div className="space-y-2">{toPlan.map((o) => <div key={o.id} draggable onDragStart={(e) => e.dataTransfer.setData("x", `o:${o.id}`)} className="cursor-grab rounded-lg border bg-card p-2 text-xs card-lift"><div className="flex justify-between"><b>{o.num}</b><StatusBadge s={o.status} /></div><div className="mt-1">{db.clients.find((c) => c.id === o.clientId)!.name} · {dh(orderTotal(o))}</div></div>)}
          {!toPlan.length && <p className="text-xs text-muted-foreground">Rien à planifier.</p>}</div>
      </Card>
    </div>
  );
}

function List({ onOpen }: { onOpen: (id: string) => void }) {
  const db = useStore((s) => s.db);
  const o = (d: Delivery) => db.orders.find((x) => x.id === d.orderId)!; const c = (d: Delivery) => db.clients.find((x) => x.id === o(d).clientId)!;
  const exp = (d: Delivery) => db.payments.find((p) => p.orderId === d.orderId)?.expected ?? 0;
  return (
    <DataTable rows={db.deliveries} exportName="livraisons" onRow={(d) => onOpen(d.id)} search={(d) => `${d.num} ${o(d).num} ${c(d).name}`}
      filters={[{ key: "s", label: "Statut", options: ["Planifiée", "En route", "Livrée", "Échec", "Reportée"], get: (d) => d.status }, { key: "l", label: "Livreur", options: db.drivers.map((x) => x.name), get: (d) => db.drivers.find((x) => x.id === d.driverId)!.name }]}
      cols={[
        { key: "n", label: "N°", render: (d) => <b>{d.num}</b>, sort: (d) => d.num, exp: (d) => d.num },
        { key: "o", label: "Commande", render: (d) => <Link to="/commandes/$id" params={{ id: d.orderId }} onClick={(e) => e.stopPropagation()} className="text-brand">{o(d).num}</Link>, exp: (d) => o(d).num },
        { key: "c", label: "Client", render: (d) => <ClientLink id={c(d).id} />, exp: (d) => c(d).name },
        { key: "a", label: "Ville", render: (d) => `${c(d).quartier}, ${c(d).city}` },
        { key: "cr", label: "Créneau", render: (d) => `${dayFr(d.date)} · ${d.slot}`, sort: (d) => d.date, exp: (d) => `${d.date} ${d.slot}` },
        { key: "l", label: "Livreur", render: (d) => db.drivers.find((x) => x.id === d.driverId)!.name },
        { key: "m", label: "À encaisser", render: (d) => <b>{dh(exp(d))}</b>, exp },
        { key: "s", label: "Statut", render: (d) => <StatusBadge s={d.status} pulse={d.status === "Échec"} />, exp: (d) => d.status },
        { key: "f", label: "Frais", render: (d) => dh(o(d).fee) },
      ]} />
  );
}

function DeliverySheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const db = useStore((s) => s.db); const st = useStore.getState();
  const [collect, setCollect] = useState(false); const [plan, setPlan] = useState(false);
  const d = db.deliveries.find((x) => x.id === id);
  const o = d && db.orders.find((x) => x.id === d.orderId); const c = o && db.clients.find((x) => x.id === o.clientId);
  const pay = d && db.payments.find((p) => p.orderId === d.orderId);
  return (
    <>
      <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {d && o && c && (<>
            <SheetHeader><SheetTitle className="font-display text-2xl">{d.num}</SheetTitle><StatusBadge s={d.status} /></SheetHeader>
            <div className="space-y-4 px-4 pb-6 text-sm">
              <Card className="p-3"><ClientLink id={c.id} /><p>{c.address}, {c.quartier} — {c.city}</p>
                <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(c.phone); toast.success(`Numéro copié : ${c.phone}`); }}><Phone className="h-3 w-3" />Appeler</Button>
                  <Button size="sm" variant="outline" asChild><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.address}, ${c.quartier}, ${c.city}, Maroc`)}`} target="_blank" rel="noreferrer"><Map className="h-3 w-3" />Ouvrir l'itinéraire</a></Button></div></Card>
              <div><b>Articles à charger</b>{o.lines.map((l) => <label key={l.productId} className="mt-1 flex items-center gap-2"><input type="checkbox" checked={d.loaded.includes(l.productId)} onChange={(e) => st.mut((x) => { const dd = x.deliveries.find((y) => y.id === d.id)!; dd.loaded = e.target.checked ? [...dd.loaded, l.productId] : dd.loaded.filter((z) => z !== l.productId); })} />{l.qty} × {l.name}</label>)}</div>
              <div className="rounded-xl bg-muted p-3">Montant à encaisser : <b className="font-display text-xl text-brand">{dh(pay?.expected ?? orderTotal(o))}</b></div>
              <p>{dayFr(d.date)} · {d.slot} · {db.drivers.find((x) => x.id === d.driverId)!.name}{d.failReason && <span className="text-brand"> · Échec : {d.failReason}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {["Planifiée", "Échec", "Reportée"].includes(d.status) && <Button variant="outline" size="sm" onClick={() => setPlan(true)}>Replanifier</Button>}
                {d.status === "Planifiée" && <Button size="sm" onClick={() => { const r = st.startDelivery(d.id); r.ok ? toast.success(r.msg) : toast.error(r.error); }}>Démarrer la tournée</Button>}
                {d.status === "En route" && <><Button size="sm" onClick={() => setCollect(true)}>Marquer livrée</Button><Button size="sm" variant="outline" onClick={() => { const r = prompt("Motif d'échec (client absent, adresse introuvable, refus) ?"); if (!r) return; const x = st.failDelivery(d.id, r); x.ok ? toast.warning(x.msg) : toast.error(x.error); }}>Échec de livraison</Button></>}
                <Button size="sm" variant="outline" onClick={() => orderPdf(db, o.id, "bon")}><FileText className="h-3 w-3" />Bon de livraison PDF</Button>
              </div>
            </div>
          </>)}
        </SheetContent>
      </Sheet>
      <CollectDialog deliveryId={collect && d ? d.id : null} onClose={() => setCollect(false)} />
      <PlanDialog orderId={plan && o ? o.id : null} onClose={() => setPlan(false)} />
    </>
  );
}

function Cash() {
  const db = useStore((s) => s.db); const remit = useStore((s) => s.remit);
  const today = new Date(nowMs(db)).toISOString().slice(0, 10);
  const todayExp = db.deliveries.filter((d) => d.date === today && ["Planifiée", "En route"].includes(d.status)).reduce((s, d) => s + (db.payments.find((p) => p.orderId === d.orderId && p.status === "À encaisser")?.expected ?? 0), 0);
  const held = db.payments.filter((p) => (p.status === "Encaissé" || p.status === "Écart") && p.mode !== "Carte bancaire (TPE)");
  const cards = [["À encaisser aujourd'hui", dh(todayExp)], ["Encaissé aujourd'hui", dh(db.payments.filter((p) => p.at?.slice(0, 10) === today).reduce((s, p) => s + (p.received ?? 0), 0))], ["Détenu par les livreurs", dh(held.reduce((s, p) => s + (p.received ?? 0), 0))], ["Écarts", String(db.payments.filter((p) => p.status === "Écart").length)]];
  const on = (id: string) => db.orders.find((o) => o.id === id)!.num;
  const dn = (id: string) => db.drivers.find((d) => d.id === id)!.name;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(([l, v]) => <Card key={l} className="p-4"><div className="text-xs font-semibold uppercase text-muted-foreground">{l}</div><div className="mt-1 font-display text-2xl font-semibold tnum">{v}</div></Card>)}</div>
      <Card><h3 className="mb-3 font-display text-lg font-semibold">Remise de caisse par livreur</h3>
        <div className="grid gap-3 md:grid-cols-2">{db.drivers.map((d) => { const ps = held.filter((p) => p.driverId === d.id); const tot = ps.reduce((s, p) => s + (p.received ?? 0), 0); const old = ps.some((p) => nowMs(db) - +new Date(p.at!) > 86400000); return (
          <div key={d.id} className={cn("flex items-center justify-between rounded-xl border p-3", old && "border-warning/50 bg-warning/5")}><div><b>{d.name}</b><div className="text-xs text-muted-foreground">{ps.length} encaissement(s){old && " · non reversé > 24 h"}</div></div><div className="flex items-center gap-3"><b className="tnum">{dh(tot)}</b><Button size="sm" disabled={!ps.length} onClick={() => { if (!confirm(`Confirmer la réception de ${dh(tot)} remis par ${d.name} ?`)) return; const r = remit(ps.map((p) => p.id)); if (r.ok) { toast.success(r.msg); simplePdf("REÇU DE REMISE DE CAISSE", [`Livreur : ${d.name}`, ...ps.map((p) => `${p.num} · ${on(p.orderId)} · ${p.mode} · ${dh(p.received ?? 0)}`), `Total : ${dh(tot)}`], `remise-${d.name}.pdf`); } else toast.error(r.error); }}>Reverser la caisse</Button></div></div>); })}</div>
      </Card>
      <DataTable rows={db.payments} exportName="encaissements" search={(p) => `${p.num} ${on(p.orderId)}`} filters={[{ key: "s", label: "Statut", options: ["À encaisser", "Encaissé", "Écart", "Reversé"], get: (p) => p.status }, { key: "m", label: "Mode", options: ["Espèces", "Chèque", "Carte bancaire (TPE)"], get: (p) => p.mode ?? "" }]}
        cols={[
          { key: "n", label: "N°", render: (p) => <b>{p.num}</b>, exp: (p) => p.num },
          { key: "o", label: "Commande", render: (p) => on(p.orderId), exp: (p) => on(p.orderId) },
          { key: "l", label: "Livreur", render: (p) => dn(p.driverId), exp: (p) => dn(p.driverId) },
          { key: "m", label: "Mode", render: (p) => p.mode ?? "—", exp: (p) => p.mode ?? "" },
          { key: "e", label: "Attendu", render: (p) => dh(p.expected), sort: (p) => p.expected, exp: (p) => p.expected },
          { key: "r", label: "Reçu", render: (p) => (p.received != null ? dh(p.received) : "—"), exp: (p) => p.received ?? "" },
          { key: "g", label: "Écart", render: (p) => (p.received != null && p.received !== p.expected ? <span className="text-brand" title={p.gapReason}>{dh(p.received - p.expected)}</span> : "") },
          { key: "s", label: "Statut", render: (p) => <StatusBadge s={p.status} />, exp: (p) => p.status },
          { key: "d", label: "Date", render: (p) => (p.at ? dateTimeFr(p.at) : ""), sort: (p) => p.at ?? "" },
        ]} />
    </div>
  );
}

function Drivers() {
  const db = useStore((s) => s.db); const mut = useStore((s) => s.mut);
  const [nn, setNn] = useState("");
  const today = new Date(nowMs(db)).toISOString().slice(0, 10);
  const cash = useMemo(() => (id: string) => db.payments.filter((p) => p.driverId === id && (p.status === "Encaissé" || p.status === "Écart") && p.mode !== "Carte bancaire (TPE)").reduce((s, p) => s + (p.received ?? 0), 0), [db.payments]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><h3 className="mb-3 font-display text-lg font-semibold">Livreurs</h3>
        {db.drivers.map((d, i) => (
          <div key={d.id} className="mb-2 grid grid-cols-[1fr_auto] gap-2 rounded-xl border p-3 text-sm">
            <div><b>{d.name}</b> · <span className="tnum">{d.phone}</span><div className="text-xs text-muted-foreground">{d.vehicle} · {db.deliveries.filter((x) => x.driverId === d.id && x.date === today).length} livraison(s) aujourd'hui · espèces {dh(cash(d.id))}</div></div>
            <select value={d.status} onChange={(e) => mut((x) => { x.drivers[i].status = e.target.value as typeof d.status; })} className="h-9 rounded-md border bg-card px-2 text-xs">{["Disponible", "En tournée", "Absent"].map((s) => <option key={s}>{s}</option>)}</select>
          </div>))}
        <div className="flex gap-2"><Input value={nn} onChange={(e) => setNn(e.target.value)} placeholder="Nom du nouveau livreur" /><Button onClick={() => { if (nn.trim().length < 2) return; mut((x) => { x.drivers.push({ id: `d${Date.now()}`, name: nn.trim(), phone: "+212 6 00 00 00 00", vehicle: "Camionnette", status: "Disponible" }); }); setNn(""); toast.success("Livreur ajouté"); }}>Ajouter</Button></div>
      </Card>
      <Card><h3 className="mb-3 font-display text-lg font-semibold">Zones de livraison</h3>
        {db.zones.map((z, i) => (
          <div key={z.id} className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm">
            <b className="flex-1">{z.name}</b>
            {z.fee === null ? <Pill>Sur devis</Pill> : <label className="flex items-center gap-1 text-xs">Frais <Input type="number" className="h-8 w-20" value={z.fee} onChange={(e) => mut((x) => { x.zones[i].fee = +e.target.value; })} /> DH</label>}
            {z.freeFrom != null && <label className="flex items-center gap-1 text-xs">Gratuit dès <Input type="number" className="h-8 w-24" value={z.freeFrom} onChange={(e) => mut((x) => { x.zones[i].freeFrom = +e.target.value; })} /> DH</label>}
          </div>))}
        <label className="mt-2 flex items-center gap-2 text-sm">Capacité par livreur et créneau <Input type="number" className="h-8 w-16" value={db.settings.capacity} onChange={(e) => mut((x) => { x.settings.capacity = Math.max(1, +e.target.value); })} /></label>
      </Card>
    </div>
  );
}
