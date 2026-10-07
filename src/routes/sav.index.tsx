import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutGrid, Rows3, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore, warrantyOf, nowMs } from "@/lib/store";
import type { Ticket, TicketStatus } from "@/lib/types";
import { dateFr } from "@/lib/format";
import { DataTable } from "@/components/bi/DataTable";
import { PageHeader, StatusBadge, SourceBadge, Pill } from "@/components/bi/ui";
import { ClientLink } from "@/components/bi/drawers";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sav/")({
  validateSearch: (s: Record<string, unknown>): { nouveau?: string; commande?: string } => ({ nouveau: s.nouveau as string | undefined, commande: s.commande as string | undefined }),
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Réclamations SAV — Belle Image" }, { name: "description", content: "Tickets SAV, garanties et interventions." }, { property: "og:title", content: "Réclamations SAV — Belle Image" }, { property: "og:description", content: "Service après-vente Belle Image." }] }),
  component: Sav,
});
export const T_STATUSES: TicketStatus[] = ["Nouvelle", "En analyse", "Technicien assigné", "Intervention planifiée", "Résolue", "Clôturée", "Refusée — hors garantie"];
const TYPES = ["Panne", "Livraison", "Produit abîmé", "Pièce manquante", "Installation", "Facturation", "Autre"];

export function WarrantyPill({ t }: { t: Ticket }) {
  const db = useStore((s) => s.db); const w = warrantyOf(db, t);
  return w.state === "ok" ? <Pill tone="success">✓ couverte</Pill> : w.state === "expired" ? <Pill tone="brand">✗ expirée</Pill> : <Pill>? à vérifier</Pill>;
}

function Sav() {
  const db = useStore((s) => s.db); const setStatus = useStore((s) => s.setTicketStatus); const nav = useNavigate(); const s = Route.useSearch();
  const [view, setView] = useState<"kanban" | "table">("kanban"); const [create, setCreate] = useState<string | null>(null);
  useEffect(() => { if (s.nouveau) setCreate(s.nouveau); }, [s.nouveau]);
  const pn = (t: Ticket) => db.products.find((p) => p.id === t.productId)!;
  const age = (t: Ticket) => Math.floor((nowMs(db) - +new Date(t.createdAt)) / 86400000);
  const open = (t: Ticket) => nav({ to: "/sav/$id", params: { id: t.id } });
  return (
    <div>
      <PageHeader title="Réclamations SAV" subtitle="Garantie calculée depuis la date de livraison — jamais promise."
        actions={<><div className="flex rounded-lg border bg-card p-0.5"><button onClick={() => setView("kanban")} className={cn("rounded-md p-1.5", view === "kanban" && "bg-accent")} aria-label="Kanban"><LayoutGrid className="h-4 w-4" /></button><button onClick={() => setView("table")} className={cn("rounded-md p-1.5", view === "table" && "bg-accent")} aria-label="Tableau"><Rows3 className="h-4 w-4" /></button></div><Button onClick={() => setCreate("1")}><Plus className="h-4 w-4" />Nouvelle réclamation</Button></>} />
      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">{T_STATUSES.map((st) => { const list = db.tickets.filter((t) => t.status === st); return (
          <div key={st} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const r = setStatus(e.dataTransfer.getData("id"), st); r.ok ? toast.success(r.msg) : toast.error(r.error); }} className="w-72 shrink-0 rounded-2xl border bg-muted/50 p-2">
            <div className="flex items-center justify-between px-2 py-1.5"><StatusBadge s={st} /><span className="text-xs font-bold text-muted-foreground">{list.length}</span></div>
            <div className="max-h-[65vh] space-y-2 overflow-y-auto p-1">{list.map((t) => (
              <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("id", t.id)} onClick={() => open(t)} className="cursor-grab rounded-xl border bg-card p-3 text-sm shadow-soft card-lift">
                <div className="flex justify-between"><b>{t.num}</b><span className={cn("text-xs", age(t) > 4 && !["Clôturée", "Résolue"].includes(t.status) ? "font-bold text-brand" : "text-muted-foreground")}>{age(t)} j</span></div>
                <ClientLink id={t.clientId} /><div className="text-xs text-muted-foreground">{pn(t).name} · {pn(t).brand}</div>
                 <div className="mt-2 flex flex-wrap gap-1"><Pill>{t.type}</Pill><WarrantyPill t={t} />{t.source.startsWith("Avis") && <Pill tone="warning">Avis ≤ 2/5</Pill>}</div>
              </div>))}</div>
          </div>); })}</div>
      ) : (
        <DataTable rows={db.tickets} exportName="sav" onRow={open} search={(t) => `${t.num} ${db.clients.find((c) => c.id === t.clientId)?.name} ${pn(t).name}`}
          filters={[{ key: "s", label: "Statut", options: T_STATUSES, get: (t) => t.status }, { key: "t", label: "Type", options: TYPES, get: (t) => t.type }, { key: "b", label: "Marque", options: db.brands.map((b) => b.name), get: (t) => pn(t).brand }, { key: "p", label: "Priorité", options: ["Basse", "Normale", "Haute"], get: (t) => t.priority }]}
          cols={[
            { key: "n", label: "N°", render: (t) => <b>{t.num}</b>, sort: (t) => t.num, exp: (t) => t.num },
            { key: "c", label: "Client", render: (t) => <ClientLink id={t.clientId} /> },
            { key: "p", label: "Produit", render: (t) => `${pn(t).name}`, exp: (t) => pn(t).name },
            { key: "ty", label: "Type", render: (t) => t.type, exp: (t) => t.type },
            { key: "g", label: "Garantie", render: (t) => <WarrantyPill t={t} /> },
            { key: "so", label: "Source", render: (t) => t.source, exp: (t) => t.source },
            { key: "s", label: "Statut", render: (t) => <StatusBadge s={t.status} />, exp: (t) => t.status },
            { key: "d", label: "Créée", render: (t) => dateFr(t.createdAt), sort: (t) => t.createdAt, exp: (t) => dateFr(t.createdAt) },
          ]} />
      )}
      <NewTicket clientPre={create && create !== "1" ? create : undefined} orderPre={s.commande} open={!!create} onClose={() => { setCreate(null); nav({ to: "/sav", search: {} }); }} />
    </div>
  );
}

function NewTicket({ open, onClose, clientPre, orderPre }: { open: boolean; onClose: () => void; clientPre?: string; orderPre?: string }) {
  const db = useStore((s) => s.db); const create = useStore((s) => s.createTicket); const nav = useNavigate();
  const [cid, setCid] = useState(""); const [oid, setOid] = useState(""); const [type, setType] = useState("Panne"); const [desc, setDesc] = useState(""); const [photos, setPhotos] = useState(0);
  useEffect(() => { if (open) { setCid(clientPre ?? ""); setOid(orderPre ?? ""); setDesc(""); setPhotos(0); } }, [open, clientPre, orderPre]);
  const delivered = db.orders.filter((o) => o.clientId === cid && o.status === "Livrée & encaissée");
  const o = db.orders.find((x) => x.id === oid);
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display text-2xl">Nouvelle réclamation</SheetTitle></SheetHeader>
        <div className="grid gap-3 px-4 text-sm">
          <div><Label>Client</Label><select value={cid} onChange={(e) => { setCid(e.target.value); setOid(""); }} className="h-10 w-full rounded-md border bg-card px-2"><option value="">Choisir…</option>{db.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><Label>Commande livrée</Label><select value={oid} onChange={(e) => setOid(e.target.value)} className="h-10 w-full rounded-md border bg-card px-2" disabled={!cid}><option value="">{delivered.length ? "Choisir…" : "Aucune commande livrée"}</option>{delivered.map((x) => <option key={x.id} value={x.id}>{x.num} — {x.lines.map((l) => l.name).join(", ")}</option>)}</select></div>
          {o && <p className="rounded-lg bg-muted p-2 text-xs">Produit : <b>{o.lines[0].name}</b> · livré le {o.deliveredAt ? dateFr(o.deliveredAt) : "?"}</p>}
          <div><Label>Type</Label><select value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-md border bg-card px-2">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><Label>Description</Label><Textarea dir="auto" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <label className="text-xs">Photos <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files?.length ?? 0)} /></label>
          <Button onClick={() => { if (!o) return toast.error("Choisissez une commande livrée"); if (desc.trim().length < 5) return toast.error("Description trop courte"); const r = create({ clientId: cid, orderId: o.id, productId: o.lines[0].productId, type, description: desc, summary: desc, photos }); if (r.ok) { toast.success(r.msg); onClose(); nav({ to: "/sav/$id", params: { id: r.id! } }); } }}>Créer la réclamation</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
