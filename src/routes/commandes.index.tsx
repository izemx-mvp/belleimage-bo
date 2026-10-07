import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Rows3, Plus, Trash2, Bot, Info } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore, orderTotal, nowMs, effectivePrice, availableOf, ORDER_FLOW } from "@/lib/store";
import { feeFor, zoneFor } from "@/lib/seed";
import type { Order, OrderStatus, Client } from "@/lib/types";
import { dh, dateFr } from "@/lib/format";
import { DataTable } from "@/components/bi/DataTable";
import { PageHeader, StatusBadge, AgentBadge, Pill } from "@/components/bi/ui";
import { ClientLink } from "@/components/bi/drawers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/commandes/")({
  validateSearch: (s: Record<string, unknown>) => ({ nouveau: s.nouveau as string | undefined, statut: s.statut as string | undefined }),
  head: () => ({ meta: [
    { title: "Commandes — Belle Image" }, { name: "description", content: "Toutes les commandes Belle Image : magasin, téléphone et WhatsApp." },
    { property: "og:title", content: "Commandes — Belle Image" }, { property: "og:description", content: "Suivi des commandes et confirmations." },
  ] }),
  component: Orders,
});

const STATUSES: OrderStatus[] = ["Nouvelle", "Confirmée", "En préparation", "Prête", "En livraison", "Livrée & encaissée", "Annulée", "Retournée"];

function Orders() {
  const db = useStore((s) => s.db); const setStatus = useStore((s) => s.setOrderStatus);
  const search = Route.useSearch(); const nav = useNavigate();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [creating, setCreating] = useState<string | null>(search.nouveau ?? null);
  useEffect(() => { if (search.nouveau) setCreating(search.nouveau); }, [search.nouveau]);
  const cl = (id: string) => db.clients.find((c) => c.id === id)!;
  const drop = (orderId: string, to: OrderStatus) => {
    const o = db.orders.find((x) => x.id === orderId)!; if (o.status === to) return;
    if (to === "Annulée") { const r = prompt("Motif d'annulation ?"); if (!r) return; const res = setStatus(orderId, to, r); res.ok ? toast.success(res.msg) : toast.error(res.error); return; }
    const res = setStatus(orderId, to); res.ok ? toast.success(res.msg) : toast.error(res.error);
  };
  return (
    <div>
      <PageHeader title="Commandes" subtitle="Paiement à la livraison uniquement — aucun paiement en ligne."
        actions={<>
          <div className="flex rounded-lg border bg-card p-0.5">
            <button onClick={() => setView("table")} className={cn("rounded-md p-1.5", view === "table" && "bg-accent text-accent-foreground")} aria-label="Tableau"><Rows3 className="h-4 w-4" /></button>
            <button onClick={() => setView("kanban")} className={cn("rounded-md p-1.5", view === "kanban" && "bg-accent text-accent-foreground")} aria-label="Kanban"><LayoutGrid className="h-4 w-4" /></button>
          </div>
          <Button onClick={() => setCreating("1")}><Plus className="h-4 w-4" />Nouvelle commande</Button>
        </>} />
      {view === "table" ? (
        <DataTable rows={db.orders} exportName="commandes" initialFilters={search.statut ? { statut: search.statut } : {}}
          onRow={(o) => nav({ to: "/commandes/$id", params: { id: o.id } })}
          search={(o) => `${o.num} ${cl(o.clientId).name} ${cl(o.clientId).phone} ${o.lines.map((l) => l.name).join(" ")}`}
          filters={[
            { key: "statut", label: "Statut", options: STATUSES, get: (o) => o.status },
            { key: "ville", label: "Ville", options: [...new Set(db.clients.map((c) => c.city))], get: (o) => cl(o.clientId).city },
            { key: "mode", label: "Mode", options: ["Livraison à domicile", "Retrait en magasin"], get: (o) => o.mode },
            { key: "source", label: "Source", options: ["Magasin", "WhatsApp Agent Catalogue", "Téléphone"], get: (o) => o.source },
          ]}
          cols={[
            { key: "num", label: "N°", render: (o) => <span className="font-semibold">{o.num}</span>, sort: (o) => o.num, exp: (o) => o.num },
            { key: "client", label: "Client", render: (o) => <ClientLink id={o.clientId} />, exp: (o) => cl(o.clientId).name },
            { key: "prod", label: "Produits", render: (o) => <span className="line-clamp-1 max-w-56 text-muted-foreground">{o.lines.map((l) => l.name).join(", ")}</span>, exp: (o) => o.lines.map((l) => l.name).join(", ") },
            { key: "tot", label: "Montant TTC", render: (o) => <b>{dh(orderTotal(o))}</b>, sort: orderTotal, exp: orderTotal },
            { key: "ville", label: "Ville", render: (o) => cl(o.clientId).city, exp: (o) => cl(o.clientId).city },
            { key: "statut", label: "Statut", render: (o) => <StatusBadge s={o.status} pulse={o.status === "Nouvelle"} />, sort: (o) => STATUSES.indexOf(o.status), exp: (o) => o.status },
            { key: "pay", label: "Paiement", render: (o) => o.status === "Livrée & encaissée" ? <Pill tone="success">Encaissé</Pill> : <Pill tone="muted">À la livraison</Pill> },
            { key: "src", label: "Source", render: (o) => o.source === "WhatsApp Agent Catalogue" ? <AgentBadge agent="Agent Catalogue" /> : o.source, exp: (o) => o.source },
            { key: "date", label: "Date", render: (o) => dateFr(o.createdAt), sort: (o) => o.createdAt, exp: (o) => dateFr(o.createdAt) },
          ]} />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STATUSES.map((s) => {
            const list = db.orders.filter((o) => o.status === s);
            return (
              <div key={s} onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(e.dataTransfer.getData("id"), s)} className="w-72 shrink-0 rounded-2xl border bg-muted/50 p-2">
                <div className="flex items-center justify-between px-2 py-1.5"><StatusBadge s={s} /><span className="text-xs font-bold text-muted-foreground">{list.length}</span></div>
                <div className="max-h-[65vh] space-y-2 overflow-y-auto p-1">
                  {list.map((o) => (
                    <div key={o.id} draggable onDragStart={(e) => e.dataTransfer.setData("id", o.id)} onClick={() => nav({ to: "/commandes/$id", params: { id: o.id } })}
                      className={cn("cursor-grab rounded-xl border bg-card p-3 text-sm shadow-soft card-lift", ORDER_FLOW[o.status].length === 0 && "cursor-pointer")}>
                      <div className="flex justify-between"><b>{o.num}</b><span className="tnum">{dh(orderTotal(o))}</span></div>
                      <div className="mt-1"><ClientLink id={o.clientId} /></div>
                      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{o.lines.map((l) => l.name).join(", ")}</div>
                      {o.source === "WhatsApp Agent Catalogue" && <div className="mt-2"><AgentBadge agent="Agent Catalogue" /></div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <NewOrder open={!!creating} preClient={creating && creating !== "1" ? creating : undefined} onClose={() => { setCreating(null); nav({ to: "/commandes", search: {} }); }} />
    </div>
  );
}

const clientSchema = z.object({
  name: z.string().trim().min(3, "Nom trop court"),
  phone: z.string().trim().regex(/^(\+212|0)\s?[5-7](\s?\d){8}$/, "Téléphone marocain invalide (+212 6xx xx xx xx)"),
  address: z.string().trim().min(5, "Adresse requise"), city: z.string().min(2), quartier: z.string().min(2, "Quartier requis"),
});

function NewOrder({ open, onClose, preClient }: { open: boolean; onClose: () => void; preClient?: string }) {
  const db = useStore((s) => s.db); const create = useStore((s) => s.createOrder); const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [clientId, setClientId] = useState(""); const [isNew, setIsNew] = useState(false);
  const [nc, setNc] = useState({ name: "", phone: "", address: "", city: "Kénitra", quartier: "", landmark: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<{ productId: string; qty: number; discount: number }[]>([]);
  const [q, setQ] = useState(""); const [mode, setMode] = useState<Order["mode"]>("Livraison à domicile"); const [notes, setNotes] = useState("");
  useEffect(() => { if (open) { setStep(0); setLines([]); setClientId(preClient ?? ""); setIsNew(false); setNotes(""); } }, [open, preClient]);
  const now = nowMs(db);
  const client: Pick<Client, "city" | "quartier"> | undefined = isNew ? nc : db.clients.find((c) => c.id === clientId);
  const sub = lines.reduce((s, l) => { const p = db.products.find((x) => x.id === l.productId)!; return s + l.qty * Math.max(0, effectivePrice(p, now) - l.discount); }, 0);
  const fee = mode === "Retrait en magasin" || !client ? 0 : feeFor(client, sub, db.zones);
  const stockIssue = lines.some((l) => l.qty > availableOf(db, db.products.find((x) => x.id === l.productId)!));
  const results = useMemo(() => db.products.filter((p) => p.status === "Actif" && q && `${p.ref} ${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6), [db.products, q]);
  const next0 = () => {
    if (isNew) { const r = clientSchema.safeParse(nc); if (!r.success) { setErrs(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; } setErrs({}); }
    else if (!clientId) return toast.error("Choisissez un client");
    setStep(1);
  };
  const submit = () => {
    const newClient = isNew ? { id: `c${Date.now()}`, ...nc, lang: "FR" as const } : undefined;
    const r = create({ clientId: newClient?.id ?? clientId, lines, mode, notes, newClient });
    if (!r.ok) return toast.error(r.error);
    toast.success(r.msg); onClose(); if (r.id) nav({ to: "/commandes/$id", params: { id: r.id } });
  };
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle className="font-display text-2xl">Nouvelle commande</SheetTitle></SheetHeader>
        <div className="px-4">
          <div className="mb-5 flex gap-2">{["Client", "Produits", "Livraison & récap"].map((s, i) => <div key={s} className={cn("flex-1 rounded-full border px-2 py-1 text-center text-xs font-semibold", i === step ? "border-brand bg-accent text-accent-foreground" : i < step ? "bg-muted" : "text-muted-foreground")}>{i + 1}. {s}</div>)}</div>
          {step === 0 && (
            <div className="space-y-3">
              <div className="flex gap-2"><Button variant={!isNew ? "default" : "outline"} size="sm" onClick={() => setIsNew(false)}>Client existant</Button><Button variant={isNew ? "default" : "outline"} size="sm" onClick={() => setIsNew(true)}>Nouveau client</Button></div>
              {!isNew ? (
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="h-10 w-full rounded-md border bg-card px-2 text-sm">
                  <option value="">Choisir un client…</option>{db.clients.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                </select>
              ) : (
                <div className="grid gap-3">
                  {(["name", "phone", "address", "quartier", "landmark"] as const).map((k) => (
                    <div key={k}><Label>{{ name: "Nom complet", phone: "Téléphone", address: "Adresse", quartier: "Quartier", landmark: "Repère (optionnel)" }[k]}</Label>
                      <Input dir="auto" value={nc[k]} onChange={(e) => setNc({ ...nc, [k]: e.target.value })} placeholder={k === "phone" ? "+212 6 12 34 56 78" : ""} />
                      {errs[k] && <p className="mt-1 text-xs text-brand">{errs[k]}</p>}</div>
                  ))}
                  <div><Label>Ville</Label><select value={nc.city} onChange={(e) => setNc({ ...nc, city: e.target.value })} className="h-10 w-full rounded-md border bg-card px-2 text-sm">{["Kénitra", "Salé", "Rabat", "Sidi Slimane", "Sidi Kacem", "Autre"].map((c) => <option key={c}>{c}</option>)}</select></div>
                </div>
              )}
              <Button className="w-full" onClick={next0}>Continuer</Button>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit (référence, nom, marque)…" />
              {results.length > 0 && <div className="rounded-xl border">{results.map((p) => (
                <button key={p.id} onClick={() => { setLines([...lines.filter((l) => l.productId !== p.id), { productId: p.id, qty: 1, discount: 0 }]); setQ(""); }} className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-0 hover:bg-accent/50">
                  <span>{p.name}<span className="ml-2 text-xs text-muted-foreground">{p.ref}</span></span><span className="tnum">{dh(effectivePrice(p, now))} · dispo {availableOf(db, p)}</span>
                </button>))}</div>}
              {lines.map((l, i) => {
                const p = db.products.find((x) => x.id === l.productId)!; const a = availableOf(db, p);
                return (
                  <div key={l.productId} className="rounded-xl border p-3 text-sm">
                    <div className="flex justify-between"><b>{p.name}</b><button onClick={() => setLines(lines.filter((_, j) => j !== i))} aria-label="Retirer"><Trash2 className="h-4 w-4 text-muted-foreground" /></button></div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span>Prix du jour : <b className="tnum">{dh(effectivePrice(p, now))}</b></span>
                      <label className="flex items-center gap-1">Qté <Input type="number" min={1} className="h-8 w-16" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, qty: Math.max(1, +e.target.value) } : x))} /></label>
                      <label className="flex items-center gap-1">Remise <Input type="number" min={0} max={500} className="h-8 w-20" value={l.discount} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, discount: Math.min(500, Math.max(0, +e.target.value)) } : x))} /> DH</label>
                    </div>
                    {l.qty > a && <p className="mt-2 text-xs font-semibold text-brand">Stock insuffisant : {a} disponible(s). La commande ne pourra pas être confirmée.</p>}
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">Remise manuelle limitée à 500 DH par ligne.</p>
              <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(0)}>Retour</Button><Button className="flex-1" disabled={!lines.length} onClick={() => setStep(2)}>Continuer</Button></div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-2">{(["Livraison à domicile", "Retrait en magasin"] as const).map((m) => <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>{m}</Button>)}</div>
              {mode === "Livraison à domicile" && client && <p className="text-muted-foreground">Zone : <b>{zoneFor(client, db.zones).name}</b> — frais {fee === null ? "sur devis" : fee === 0 ? "offerts" : dh(fee)}</p>}
              <div><Label>Note</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Créneau souhaité, étage…" /></div>
              <div className="space-y-1 rounded-xl border bg-muted/40 p-4">
                <div className="flex justify-between"><span>Sous-total</span><span className="tnum">{dh(sub)}</span></div>
                <div className="flex justify-between"><span>Livraison</span><span className="tnum">{dh(fee ?? 0)}</span></div>
                <div className="flex justify-between border-t pt-2 font-display text-xl font-semibold text-brand"><span>À payer à la livraison</span><span className="tnum">{dh(sub + (fee ?? 0))}</span></div>
              </div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Info className="h-4 w-4" />Paiement à la livraison — aucun paiement en ligne.</p>
              {stockIssue && <p className="text-xs font-semibold text-warning">Attention : une ligne dépasse le stock disponible.</p>}
              <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(1)}>Retour</Button><Button className="flex-1" onClick={submit}>Créer la commande</Button></div>
            </div>
          )}
        </div>
        <span className="hidden"><Bot /></span>
      </SheetContent>
    </Sheet>
  );
}
