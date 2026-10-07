import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PackagePlus, SlidersHorizontal, ClipboardList, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore, availableOf, reservedOf, stockStatus } from "@/lib/store";
import { dh0, dateTimeFr } from "@/lib/format";
import { simplePdf } from "@/lib/pdf";
import { DataTable } from "@/components/bi/DataTable";
import { PageHeader, StatusBadge, Tabs, ProductThumb, Card } from "@/components/bi/ui";

export const Route = createFileRoute("/stock")({
  head: () => ({ meta: [{ title: "Stock — Belle Image" }, { name: "description", content: "Stock, réservations, seuils et mouvements." }, { property: "og:title", content: "Stock — Belle Image" }, { property: "og:description", content: "Suivi du stock magasin et dépôt." }] }),
  component: Stock,
});

function Stock() {
  const db = useStore((s) => s.db); const st = useStore.getState();
  const [tab, setTab] = useState<"etat" | "mouvements">("etat");
  const [rec, setRec] = useState(false); const [adj, setAdj] = useState<string | null>(null); const [inv, setInv] = useState(false);
  const act = db.products.filter((p) => p.status !== "Archivé");
  const low = act.filter((p) => stockStatus(db, p) === "Stock bas"); const out = act.filter((p) => stockStatus(db, p) === "Rupture");
  const pn = (id: string) => db.products.find((p) => p.id === id)!.name;
  const supplier = () => simplePdf("COMMANDE FOURNISSEUR", [...low, ...out].map((p) => `${p.ref} — ${p.name} — disponible ${availableOf(db, p)} — à commander : ${Math.max(1, p.threshold * 2 - availableOf(db, p))}`), "commande-fournisseur.pdf");
  return (
    <div>
      <PageHeader title="Stock" subtitle="Disponible = en stock − réservé (commandes confirmées non livrées)."
        actions={<><Button onClick={() => setRec(true)}><PackagePlus className="h-4 w-4" />Réception fournisseur</Button><Button variant="outline" onClick={() => setInv(true)}><ClipboardList className="h-4 w-4" />Inventaire</Button>{low.length + out.length > 0 && <Button variant="outline" onClick={supplier}><FileText className="h-4 w-4" />Préparer une commande fournisseur</Button>}</>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["Valeur du stock", dh0(act.reduce((s, p) => s + p.stock * (p.purchasePrice ?? p.price), 0))], ["Produits en stock", act.filter((p) => p.stock > 0).length], ["Stock bas", low.length], ["Rupture", out.length], ["Réservé", act.reduce((s, p) => s + reservedOf(db, p.id), 0)]].map(([l, v]) => (
          <Card key={l as string} className="p-4"><div className="text-xs font-semibold uppercase text-muted-foreground">{l}</div><div className="mt-1 font-display text-2xl font-semibold tnum">{v}</div></Card>))}
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ v: "etat", label: "État du stock" }, { v: "mouvements", label: "Mouvements", count: db.movements.length }]} />
      {tab === "etat" ? (
        <DataTable rows={act} exportName="stock" search={(p) => `${p.ref} ${p.name}`} onRow={(p) => setAdj(p.id)}
          filters={[{ key: "s", label: "Statut", options: ["En stock", "Stock bas", "Rupture"], get: (p) => stockStatus(db, p) }, { key: "c", label: "Catégorie", options: db.subs.map((s) => s.sub), get: (p) => p.sub }, { key: "b", label: "Marque", options: db.brands.map((b) => b.name), get: (p) => p.brand }, { key: "e", label: "Emplacement", options: ["Magasin", "Dépôt"], get: (p) => p.location }]}
          cols={[
            { key: "i", label: "", render: (p) => <ProductThumb p={p} square className="w-10" /> },
            { key: "n", label: "Produit", render: (p) => <span className="font-semibold">{p.name}</span>, sort: (p) => p.name, exp: (p) => p.name },
            { key: "r", label: "Référence", render: (p) => <span className="font-mono text-xs">{p.ref}</span>, exp: (p) => p.ref },
            { key: "s", label: "En stock", render: (p) => p.stock, sort: (p) => p.stock, exp: (p) => p.stock },
            { key: "re", label: "Réservé", render: (p) => reservedOf(db, p.id), exp: (p) => reservedOf(db, p.id) },
            { key: "d", label: "Disponible", render: (p) => <b>{availableOf(db, p)}</b>, sort: (p) => availableOf(db, p), exp: (p) => availableOf(db, p) },
            { key: "t", label: "Seuil", render: (p) => <span onClick={(e) => e.stopPropagation()}><Input type="number" className="h-8 w-16" value={p.threshold} onChange={(e) => st.setThreshold(p.id, +e.target.value)} /></span> },
            { key: "l", label: "Emplacement", render: (p) => p.location },
            { key: "st", label: "Statut", render: (p) => <StatusBadge s={stockStatus(db, p)} pulse={stockStatus(db, p) !== "En stock"} />, exp: (p) => stockStatus(db, p) },
            { key: "a", label: "", render: (p) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setAdj(p.id); }}><SlidersHorizontal className="h-3 w-3" />Ajuster</Button> },
          ]} />
      ) : (
        <DataTable rows={db.movements} exportName="mouvements" search={(m) => pn(m.productId)} filters={[{ key: "t", label: "Type", options: ["Entrée fournisseur", "Sortie livraison", "Retour client", "Ajustement", "Inventaire"], get: (m) => m.type }]}
          cols={[
            { key: "d", label: "Date", render: (m) => dateTimeFr(m.at), sort: (m) => m.at, exp: (m) => dateTimeFr(m.at) },
            { key: "p", label: "Produit", render: (m) => pn(m.productId), exp: (m) => pn(m.productId) },
            { key: "t", label: "Type", render: (m) => m.type, exp: (m) => m.type },
            { key: "q", label: "Qté", render: (m) => <b className={m.qty < 0 ? "text-brand" : "text-success"}>{m.qty > 0 ? "+" : ""}{m.qty}</b>, exp: (m) => m.qty },
            { key: "ba", label: "Avant → après", render: (m) => `${m.before} → ${m.after}` },
            { key: "r", label: "Motif / document", render: (m) => m.reason, exp: (m) => m.reason },
            { key: "a", label: "Auteur", render: (m) => m.author, exp: (m) => m.author },
          ]} />
      )}
      <ReceiveDialog open={rec} onClose={() => setRec(false)} />
      <AdjustDialog pid={adj} onClose={() => setAdj(null)} />
      <InventoryDialog open={inv} onClose={() => setInv(false)} />
    </div>
  );
}

function ReceiveDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useStore((s) => s.db); const receive = useStore((s) => s.receive);
  const [sup, setSup] = useState("Samsung Maroc"); const [bl, setBl] = useState("BL-"); const [lines, setLines] = useState<{ productId: string; qty: number }[]>([{ productId: "", qty: 1 }]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Réception fournisseur</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2"><div><Label>Fournisseur</Label><Input value={sup} onChange={(e) => setSup(e.target.value)} /></div><div><Label>N° bon</Label><Input value={bl} onChange={(e) => setBl(e.target.value)} /></div></div>
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <select value={l.productId} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))} className="h-10 flex-1 rounded-md border bg-card px-2 text-sm"><option value="">Produit…</option>{db.products.map((p) => <option key={p.id} value={p.id}>{p.name} (dispo {availableOf(db, p)})</option>)}</select>
              <Input type="number" min={1} className="w-20" value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: +e.target.value } : x)))} />
            </div>))}
          <Button variant="outline" size="sm" onClick={() => setLines([...lines, { productId: "", qty: 1 }])}>+ Ligne</Button>
          <Button onClick={() => { if (bl.trim().length < 4) return toast.error("N° de bon requis"); const r = receive(sup, bl, lines.filter((l) => l.productId)); if (r.ok) { toast.success(r.msg); onClose(); setLines([{ productId: "", qty: 1 }]); } else toast.error(r.error); }}>Enregistrer la réception</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdjustDialog({ pid, onClose }: { pid: string | null; onClose: () => void }) {
  const db = useStore((s) => s.db); const adjust = useStore((s) => s.adjust);
  const [q, setQ] = useState(0); const [reason, setReason] = useState("");
  const p = db.products.find((x) => x.id === pid);
  const mv = db.movements.filter((m) => m.productId === pid).slice(0, 8);
  return (
    <Dialog open={!!pid} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajuster le stock — {p?.name}</DialogTitle></DialogHeader>
        {p && <div className="grid gap-3 text-sm">
          <p>En stock : <b>{p.stock}</b> · Réservé : {reservedOf(db, p.id)} · Disponible : <b>{availableOf(db, p)}</b></p>
          <div><Label>Quantité (+/−)</Label><Input type="number" value={q} onChange={(e) => setQ(+e.target.value)} /></div>
          <div><Label>Motif (obligatoire)</Label><select value={reason} onChange={(e) => setReason(e.target.value)} className="h-10 w-full rounded-md border bg-card px-2"><option value="">Choisir…</option>{["Casse", "Erreur de saisie", "Don", "Exposition magasin", "Autre"].map((r) => <option key={r}>{r}</option>)}</select></div>
          <Button onClick={() => { if (!q) return toast.error("Quantité nulle"); const r = adjust(p.id, q, reason); if (r.ok) { toast.success(r.msg); setQ(0); setReason(""); onClose(); } else toast.error(r.error); }}>Valider</Button>
          <div><b>Derniers mouvements</b><ul className="mt-1 text-xs text-muted-foreground">{mv.map((m) => <li key={m.id}>{dateTimeFr(m.at)} · {m.type} · {m.qty > 0 ? "+" : ""}{m.qty} · {m.reason}</li>)}</ul></div>
        </div>}
      </DialogContent>
    </Dialog>
  );
}

function InventoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useStore((s) => s.db); const adjust = useStore((s) => s.adjust);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const list = db.products.filter((p) => p.status !== "Archivé");
  const gaps = list.filter((p) => counts[p.id] != null && counts[p.id] !== p.stock);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Inventaire — quantités comptées</DialogTitle></DialogHeader>
        <div className="max-h-[55vh] overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground"><tr><th>Produit</th><th>Théorique</th><th>Compté</th><th>Écart</th></tr></thead>
          <tbody>{list.map((p) => <tr key={p.id} className="border-t"><td className="py-1.5">{p.name}</td><td>{p.stock}</td><td><Input type="number" className="h-8 w-20" placeholder={String(p.stock)} value={counts[p.id] ?? ""} onChange={(e) => setCounts({ ...counts, [p.id]: e.target.value === "" ? (undefined as unknown as number) : +e.target.value })} /></td><td className={counts[p.id] != null && counts[p.id] !== p.stock ? "font-bold text-brand" : ""}>{counts[p.id] != null ? counts[p.id] - p.stock : ""}</td></tr>)}</tbody></table></div>
        <Button onClick={() => { gaps.forEach((p) => adjust(p.id, counts[p.id] - p.stock, "Inventaire physique", "Inventaire")); toast.success(`${gaps.length} écart(s) enregistrés`); setCounts({}); onClose(); }}>Valider l'inventaire ({gaps.length} écarts)</Button>
      </DialogContent>
    </Dialog>
  );
}
