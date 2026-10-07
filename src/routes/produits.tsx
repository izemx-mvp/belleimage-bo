import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, MessageCircle, Undo2, Plus, CalendarClock, Bot } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore, nowMs, effectivePrice, promoActive, availableOf, stockStatus, type DB } from "@/lib/store";
import type { Product } from "@/lib/types";
import { dh, dateFr, dateTimeFr, pct } from "@/lib/format";
import { DataTable } from "@/components/bi/DataTable";
import { PageHeader, StatusBadge, Tabs, ProductThumb, StockBar, Pill, Card, AgentBadge } from "@/components/bi/ui";
import { useDrawers } from "@/components/bi/drawers";

type Tab = "catalogue" | "import" | "historique" | "categories";
export const Route = createFileRoute("/produits")({
  validateSearch: (s: Record<string, unknown>) => ({ onglet: (s.onglet as Tab) || undefined, produit: s.produit as string | undefined }),
  head: () => ({ meta: [{ title: "Produits & Prix — Belle Image" }, { name: "description", content: "Catalogue, import Excel des prix et historique." }, { property: "og:title", content: "Produits & Prix — Belle Image" }, { property: "og:description", content: "Gestion du catalogue et des prix." }] }),
  component: Products,
});

function Products() {
  const s = Route.useSearch(); const nav = useNavigate({ from: "/produits" });
  const tab = s.onglet ?? "catalogue";
  return (
    <div>
      <PageHeader title="Produits & Prix" subtitle="Les prix sont affichés TTC. Une modification ne change jamais une commande existante." />
      <Tabs value={tab} onChange={(v) => nav({ search: { onglet: v } })} items={[{ v: "catalogue", label: "Catalogue" }, { v: "import", label: "Import Excel" }, { v: "historique", label: "Historique des prix" }, { v: "categories", label: "Catégories & marques" }]} />
      {tab === "catalogue" && <Catalogue openId={s.produit} />}
      {tab === "import" && <ImportExcel />}
      {tab === "historique" && <History />}
      {tab === "categories" && <Categories />}
    </div>
  );
}

function Catalogue({ openId }: { openId?: string }) {
  const db = useStore((s) => s.db); const mut = useStore((s) => s.mut); const advance = useStore((s) => s.advanceDays);
  const [edit, setEdit] = useState<Product | null>(null); const [cards, setCards] = useState(false);
  const now = nowMs(db);
  useEffect(() => { if (openId) setEdit(db.products.find((p) => p.id === openId) ?? null); }, [openId]); // eslint-disable-line
  const blank = (): Product => ({ id: `p${Date.now()}`, ref: "", name: "", nameAr: "", brand: "Samsung", category: "Électroménager", sub: "Réfrigérateurs", price: 0, stock: 0, threshold: 3, location: "Magasin", status: "Brouillon", agentVisible: false, warrantyMonths: 24, description: "", deliveryDays: 2 });
  return (
    <>
      <DataTable rows={db.products} exportName="catalogue" onRow={setEdit}
        search={(p) => `${p.ref} ${p.name} ${p.brand}`}
        actions={<><Button size="sm" variant="outline" onClick={() => setCards(!cards)}>{cards ? "Vue tableau" : "Vue cartes"}</Button>
          <Button size="sm" variant="outline" onClick={() => { advance(7); toast.info("Horloge de démo avancée de 7 jours — promos expirées recalculées"); }}><CalendarClock className="h-4 w-4" />Simuler le passage de la date</Button>
          <Button size="sm" onClick={() => setEdit(blank())}><Plus className="h-4 w-4" />Produit</Button></>}
        filters={[
          { key: "cat", label: "Catégorie", options: db.subs.map((x) => x.sub), get: (p) => p.sub },
          { key: "brand", label: "Marque", options: db.brands.map((b) => b.name), get: (p) => p.brand },
          { key: "stock", label: "Stock", options: ["En stock", "Stock bas", "Rupture"], get: (p) => stockStatus(db, p) },
          { key: "promo", label: "Promo", options: ["En promo"], get: (p) => (promoActive(p, now) ? "En promo" : "") },
          { key: "status", label: "Statut", options: ["Actif", "Brouillon", "Archivé"], get: (p) => p.status },
        ]}
        cols={cards ? [{ key: "card", label: "Produit", render: (p) => (
          <div className="flex items-center gap-4"><ProductThumb p={p} className="w-32" /><div><div className="text-xs text-muted-foreground">{p.brand}</div><div className="font-semibold">{p.name}</div><div className="font-display text-lg font-semibold">{dh(effectivePrice(p, now))}</div>{promoActive(p, now) && <Pill tone="brand">Promo</Pill>}</div></div>) }] : [
          { key: "img", label: "", render: (p) => <ProductThumb p={p} square className="w-11" /> },
          { key: "ref", label: "Référence", render: (p) => <span className="font-mono text-xs">{p.ref}</span>, sort: (p) => p.ref, exp: (p) => p.ref },
          { key: "name", label: "Désignation", render: (p) => <span className="font-semibold">{p.name}</span>, sort: (p) => p.name, exp: (p) => p.name },
          { key: "brand", label: "Marque", render: (p) => p.brand, exp: (p) => p.brand },
          { key: "cat", label: "Catégorie", render: (p) => <span className="text-xs text-muted-foreground">{p.category} › {p.sub}</span>, exp: (p) => p.sub },
          { key: "price", label: "Prix TTC", sort: (p) => effectivePrice(p, now), exp: (p) => effectivePrice(p, now), render: (p) => promoActive(p, now) ? <div><b className="text-brand">{dh(effectivePrice(p, now))}</b><div className="text-xs text-muted-foreground line-through">{dh(p.price)}</div></div> : <b>{dh(p.price)}</b> },
          { key: "stock", label: "Disponible", sort: (p) => availableOf(db, p), render: (p) => <div className="flex items-center gap-2"><StockBar value={availableOf(db, p)} max={20} /><span>{availableOf(db, p)}</span></div> },
          { key: "status", label: "Statut", render: (p) => <StatusBadge s={p.status} /> },
          { key: "agent", label: "Agent", render: (p) => <span onClick={(e) => e.stopPropagation()}><Switch checked={p.agentVisible} onCheckedChange={(v) => mut((d) => { d.products.find((x) => x.id === p.id)!.agentVisible = v; })} aria-label="Publié pour l'Agent Catalogue" /></span> },
        ]} />
      <ProductEditor p={edit} onClose={() => setEdit(null)} />
    </>
  );
}

function ProductEditor({ p, onClose }: { p: Product | null; onClose: () => void }) {
  const db = useStore((s) => s.db); const save = useStore((s) => s.saveProduct);
  const [f, setF] = useState<Product | null>(p); const [imgErr, setImgErr] = useState(false);
  useEffect(() => { setF(p); setImgErr(false); }, [p]);
  if (!f) return <Sheet open={false} />;
  const now = nowMs(db); const hist = db.priceHistory.filter((h) => h.productId === f.id).slice(0, 6);
  const set = (patch: Partial<Product>) => setF({ ...f, ...patch });
  const submit = () => {
    if (!f.ref.trim() || !f.name.trim()) return toast.error("Référence et désignation obligatoires");
    if (!(f.price > 0)) return toast.error("Prix invalide");
    if (f.promo && (f.promo.price >= f.price || !f.promo.start || !f.promo.end || f.promo.end < f.promo.start)) return toast.error("Promo invalide : prix inférieur au prix normal et dates cohérentes requis");
    if (f.imageUrl && !/^https:\/\//.test(f.imageUrl) && !f.imageUrl.startsWith("data:")) return toast.error("Le lien de l'image doit commencer par https://");
    const r = save(f); r.ok ? (toast.success(r.msg), onClose()) : toast.error(r.error);
  };
  return (
    <Sheet open={!!p} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader><SheetTitle className="font-display text-2xl">{f.name || "Nouveau produit"}</SheetTitle></SheetHeader>
        <div className="space-y-6 px-4 pb-6 text-sm">
          <div className="rounded-xl border border-brand/20 bg-accent/40 p-3 text-xs"><Bot className="mr-1 inline h-3 w-3 text-brand" /><b>Données lues par l'agent :</b> prix {dh(effectivePrice(f, now))} · stock affiché « {availableOf(db, f) <= 0 ? "indisponible" : availableOf(db, f) <= f.threshold ? "bientôt épuisé" : "disponible"} » · {f.agentVisible ? "publié" : "non publié"} · synchro {dateTimeFr(now)}</div>
          <section className="grid gap-3 sm:grid-cols-2">
            <h3 className="font-display text-lg font-semibold sm:col-span-2">Général</h3>
            <div><Label>Désignation</Label><Input value={f.name} onChange={(e) => set({ name: e.target.value })} /></div>
            <div><Label>Désignation (arabe)</Label><Input dir="rtl" className="font-arabic" value={f.nameAr} onChange={(e) => set({ nameAr: e.target.value })} /></div>
            <div><Label>Référence</Label><Input value={f.ref} onChange={(e) => set({ ref: e.target.value.toUpperCase() })} /></div>
            <div><Label>Marque</Label><select value={f.brand} onChange={(e) => set({ brand: e.target.value, warrantyMonths: db.brands.find((b) => b.name === e.target.value)!.warranty })} className="h-10 w-full rounded-md border bg-card px-2">{db.brands.map((b) => <option key={b.name}>{b.name}</option>)}</select></div>
            <div><Label>Sous-catégorie</Label><select value={f.sub} onChange={(e) => { const s = db.subs.find((x) => x.sub === e.target.value)!; set({ sub: s.sub, category: s.cat }); }} className="h-10 w-full rounded-md border bg-card px-2">{db.subs.map((s) => <option key={s.sub}>{s.sub}</option>)}</select></div>
            <div><Label>Statut</Label><select value={f.status} onChange={(e) => set({ status: e.target.value as Product["status"] })} className="h-10 w-full rounded-md border bg-card px-2">{["Actif", "Brouillon", "Archivé"].map((s) => <option key={s}>{s}</option>)}</select></div>
            <div><Label>Garantie (mois)</Label><Input type="number" value={f.warrantyMonths} onChange={(e) => set({ warrantyMonths: +e.target.value })} /></div>
            <div><Label>Délai de livraison (jours)</Label><Input type="number" value={f.deliveryDays} onChange={(e) => set({ deliveryDays: +e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea value={f.description} onChange={(e) => set({ description: e.target.value })} /></div>
          </section>
          <section className="grid gap-3 sm:grid-cols-2">
            <h3 className="font-display text-lg font-semibold sm:col-span-2">Prix</h3>
            <div><Label>Prix de vente TTC</Label><Input type="number" value={f.price} onChange={(e) => set({ price: +e.target.value })} /></div>
            <div><Label>Prix d'achat (optionnel)</Label><Input type="number" value={f.purchasePrice ?? ""} onChange={(e) => set({ purchasePrice: +e.target.value || undefined })} />{f.purchasePrice ? <p className="mt-1 text-xs text-success">Marge : {dh(f.price - f.purchasePrice)} ({(((f.price - f.purchasePrice) / f.price) * 100).toFixed(0)} %)</p> : null}</div>
            <div><Label>Prix promo</Label><Input type="number" value={f.promo?.price ?? ""} onChange={(e) => set({ promo: e.target.value ? { start: f.promo?.start ?? "", end: f.promo?.end ?? "", price: +e.target.value } : undefined })} /></div>
            {f.promo && <div className="grid grid-cols-2 gap-2"><div><Label>Début</Label><Input type="date" value={f.promo.start} onChange={(e) => set({ promo: { ...f.promo!, start: e.target.value } })} /></div><div><Label>Fin</Label><Input type="date" value={f.promo.end} onChange={(e) => set({ promo: { ...f.promo!, end: e.target.value } })} /></div></div>}
            {f.promo?.start && <p className="text-xs text-brand sm:col-span-2">Promo du {dateFr(f.promo.start)} au {dateFr(f.promo.end)} — le prix repasse automatiquement à {dh(f.price)} ensuite.</p>}
            {hist.length > 0 && <div className="sm:col-span-2"><Label>Historique</Label><ul className="mt-1 text-xs text-muted-foreground">{hist.map((h) => <li key={h.id}>{dateFr(h.at)} : {dh(h.old)} → {dh(h.new)} ({h.origin})</li>)}</ul></div>}
          </section>
          <section className="space-y-3">
            <h3 className="font-display text-lg font-semibold">Visuel</h3>
            <div className="flex gap-4"><ProductThumb key={f.imageUrl} p={f} className="w-40" />
              <div className="flex-1 space-y-2">
                <Label>Lien de l'image</Label><Input value={f.imageUrl?.startsWith("data:") ? "(photo téléversée)" : f.imageUrl ?? ""} onChange={(e) => { set({ imageUrl: e.target.value || undefined }); setImgErr(false); }} placeholder="https://belleimage.izemxlab.com/…" />
                {f.imageUrl && !f.imageUrl.startsWith("data:") && <img src={f.imageUrl} alt="" className="hidden" onError={() => setImgErr(true)} onLoad={() => setImgErr(false)} />}
                {imgErr && <p className="text-xs text-brand">Ce lien ne charge pas d'image.</p>}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold"><Upload className="h-3 w-3" />Téléverser une photo<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => set({ imageUrl: r.result as string }); r.readAsDataURL(file); }} /></label>
                  <Button size="sm" variant="outline" onClick={() => set({ imageUrl: undefined })}>Utiliser le visuel par défaut</Button>
                </div>
              </div>
            </div>
          </section>
          <div className="flex gap-2">
            <Button onClick={submit}>Enregistrer</Button>
            <Button variant="outline" onClick={() => setF({ ...f, id: `p${Date.now()}`, ref: f.ref + "-COPIE", status: "Brouillon" })}>Dupliquer</Button>
            <Button variant="outline" onClick={() => { const r = save({ ...f, status: "Archivé", agentVisible: false }); r.ok ? (toast.success("Produit archivé"), onClose()) : toast.error(r.error); }}>Archiver</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------- Import Excel ----------------
type Row = { i: number; ref: string; name: string; productId?: string; old?: number; price?: number; promo?: { price: number; start: string; end: string }; imageUrl?: string; state: "Prêt" | "Sans changement" | "Variation forte" | "Erreur"; msg?: string; variation?: number };
const HEAD = ["Référence", "Désignation", "Prix actuel TTC", "Nouveau prix TTC", "Prix promo TTC (optionnel)", "Début promo", "Fin promo", "URL image (optionnel)"];

function download(rows: (string | number)[][], name: string) {
  const ws = XLSX.utils.aoa_to_sheet([HEAD, ...rows]); ws["!cols"] = HEAD.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Prix"); XLSX.writeFile(wb, name);
}
const toDate = (v: unknown) => { if (!v) return ""; if (typeof v === "number") { const d = XLSX.SSF.parse_date_code(v); return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`; } const s = String(v).trim(); const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : s; };

function analyse(db: DB, raw: Record<string, unknown>[], map: Record<string, string>): Row[] {
  const g = (r: Record<string, unknown>, k: string) => r[map[k]];
  return raw.map((r, i) => {
    const ref = String(g(r, "Référence") ?? "").trim(); const p = db.products.find((x) => x.ref === ref);
    const row: Row = { i, ref, name: p?.name ?? String(g(r, "Désignation") ?? ""), state: "Prêt" };
    if (!p) return { ...row, state: "Erreur", msg: "Référence inconnue" };
    row.productId = p.id; row.old = p.price;
    const np = g(r, "Nouveau prix TTC"); const n = typeof np === "number" ? np : parseFloat(String(np ?? "").replace(/\s/g, "").replace(",", "."));
    if (np === undefined || np === "") return { ...row, state: "Erreur", msg: "Prix vide" };
    if (isNaN(n)) return { ...row, state: "Erreur", msg: "Prix non numérique" };
    if (n <= 0) return { ...row, state: "Erreur", msg: "Prix négatif ou nul" };
    row.price = n;
    const pp = g(r, "Prix promo TTC (optionnel)");
    if (pp !== undefined && pp !== "") {
      const s = toDate(g(r, "Début promo")), e = toDate(g(r, "Fin promo"));
      if (!s || !e) return { ...row, state: "Erreur", msg: "Promo sans dates" };
      if (e < s) return { ...row, state: "Erreur", msg: "Fin avant début" };
      if (+pp >= n) return { ...row, state: "Erreur", msg: "Prix promo supérieur au prix normal" };
      row.promo = { price: +pp, start: s, end: e };
    }
    const img = g(r, "URL image (optionnel)");
    if (img) { if (!/^https:\/\//.test(String(img))) return { ...row, state: "Erreur", msg: "URL image : https obligatoire" }; row.imageUrl = String(img); }
    row.variation = ((n - p.price) / p.price) * 100;
    if (n === p.price && !row.promo && !row.imageUrl) return { ...row, state: "Sans changement" };
    if (Math.abs(row.variation) > db.settings.varThreshold) return { ...row, state: "Variation forte", msg: `> ±${db.settings.varThreshold} %` };
    return row;
  });
}

function ImportExcel() {
  const db = useStore((s) => s.db); const apply = useStore((s) => s.applyImport); const undo = useStore((s) => s.undoImport);
  const [file, setFile] = useState(""); const [raw, setRaw] = useState<Record<string, unknown>[]>([]); const [cols, setCols] = useState<string[]>([]);
  const [map, setMap] = useState<Record<string, string>>({}); const [filter, setFilter] = useState(""); const [sel, setSel] = useState<number[]>([]); const [busy, setBusy] = useState(false); const [drag, setDrag] = useState(false);
  const rows = useMemo(() => (raw.length ? analyse(db, raw, map) : []), [raw, map, db]);
  const cnt = (s: Row["state"]) => rows.filter((r) => r.state === s).length;
  const template = () => download(db.products.map((p) => [p.ref, p.name, p.price, p.price, "", "", "", p.imageUrl?.startsWith("https") ? p.imageUrl : ""]), "modele-prix-belle-image.xlsx");
  const example = () => {
    const ps = db.products.filter((p) => p.status !== "Archivé");
    const out: (string | number)[][] = [];
    ps.slice(0, 38).forEach((p, i) => out.push([p.ref, p.name, p.price, Math.round(p.price * (1 + (i % 2 ? 0.05 : -0.03)) / 10) * 10, "", "", "", ""]));
    ps.slice(38, 44).forEach((p) => out.push([p.ref, p.name, p.price, p.price, "", "", "", ""]));
    ps.slice(44, 47).forEach((p) => out.push([p.ref, p.name, p.price, Math.round(p.price * 1.45), "", "", "", ""]));
    out.push(["XXX-INCONNU-99", "Produit inconnu", 0, 1990, "", "", "", ""]); out.push([ps[47].ref, ps[47].name, ps[47].price, -100, "", "", "", ""]);
    download(out, "exemple-import-prix.xlsx");
  };
  const read = async (f: File) => {
    const wb = XLSX.read(await f.arrayBuffer()); const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    if (!data.length) return toast.error("Fichier vide");
    const c = Object.keys(data[0]); setCols(c);
    setMap(Object.fromEntries(HEAD.map((h) => [h, c.find((x) => x.toLowerCase().trim() === h.toLowerCase()) ?? c.find((x) => x.toLowerCase().includes(h.split(" ")[0].toLowerCase())) ?? ""])));
    setRaw(data); setFile(f.name); setSel([]); toast.success(`${data.length} lignes lues dans « ${f.name} »`);
  };
  const go = (ids: number[]) => {
    const ok = rows.filter((r) => ids.includes(r.i) && r.state !== "Erreur" && r.state !== "Sans changement");
    if (!ok.length) return toast.error("Aucune ligne applicable");
    const strong = ok.filter((r) => r.state === "Variation forte");
    const avg = ok.reduce((s, r) => s + (r.variation ?? 0), 0) / ok.length;
    if (!confirm(`${ok.length} prix seront modifiés. Variation moyenne : ${pct(avg)}.${strong.length ? `\n⚠ ${strong.length} variation(s) forte(s).` : ""}`)) return;
    if (strong.length && !confirm(`Double confirmation : ${strong.length} ligne(s) dépassent ±${db.settings.varThreshold} %. Confirmer ?`)) return;
    setBusy(true);
    setTimeout(() => {
      const r = apply(file, ok.map((x) => ({ productId: x.productId!, price: x.price!, promo: x.promo, imageUrl: x.imageUrl })), rows.length - ok.length - cnt("Erreur"), cnt("Erreur"));
      setBusy(false); r.ok ? (toast.success(r.msg), setRaw([])) : toast.error(r.error);
    }, 1200);
  };
  const exportErr = () => { const ws = XLSX.utils.json_to_sheet(rows.filter((r) => r.state === "Erreur").map((r) => ({ Ligne: r.i + 2, Référence: r.ref, Erreur: r.msg }))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Erreurs"); XLSX.writeFile(wb, "erreurs-import.xlsx"); };
  const ready = rows.filter((r) => r.state === "Prêt" || r.state === "Variation forte").map((r) => r.i);
  const shown = rows.filter((r) => !filter || r.state === filter);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h3 className="font-display text-lg font-semibold">1. Télécharger le modèle</h3><p className="mt-1 text-sm text-muted-foreground">Fichier Excel pré-rempli avec les {db.products.length} produits actuels.</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={template}><Download className="h-4 w-4" />Modèle .xlsx</Button><Button variant="outline" onClick={example}>Télécharger un exemple d'import</Button></div></Card>
        <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) read(f); }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${drag ? "border-brand bg-accent" : "bg-card"}`}>
          <Upload className="h-8 w-8 text-brand" /><b className="mt-2">2. Déposer le fichier</b><span className="text-sm text-muted-foreground">.xlsx ou .csv — glisser-déposer ou cliquer</span>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ""; }} />
        </label>
      </div>
      {raw.length > 0 && (
        <Card>
          <h3 className="font-display text-lg font-semibold">Correspondance des colonnes</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">{HEAD.map((h) => <div key={h}><Label className="text-xs">{h}</Label><select value={map[h]} onChange={(e) => setMap({ ...map, [h]: e.target.value })} className="h-9 w-full rounded-md border bg-card px-2 text-xs"><option value="">—</option>{cols.map((c) => <option key={c}>{c}</option>)}</select></div>)}</div>
          <h3 className="mt-6 font-display text-lg font-semibold">3. Aperçu avant application — rien n'est encore modifié</h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">{(["Prêt", "Sans changement", "Variation forte", "Erreur"] as const).map((s) => <button key={s} onClick={() => setFilter(filter === s ? "" : s)} className={filter === s ? "ring-2 ring-brand rounded-full" : ""}><StatusBadge s={`${s}`} /> <b className="tnum">{cnt(s)}</b></button>)}
            {cnt("Erreur") > 0 && <Button size="sm" variant="outline" onClick={exportErr}>Exporter les erreurs</Button>}</div>
          <div className="mt-3 max-h-96 overflow-auto rounded-xl border">
            <table className="w-full text-sm"><thead className="sticky top-0 bg-card"><tr className="text-left text-xs uppercase text-muted-foreground"><th className="p-2"></th><th>Référence</th><th>Désignation</th><th>Ancien → Nouveau</th><th>Variation</th><th>Promo</th><th>État</th></tr></thead>
              <tbody>{shown.map((r) => <tr key={r.i} className="border-t"><td className="p-2"><input type="checkbox" disabled={r.state === "Erreur"} checked={sel.includes(r.i)} onChange={(e) => setSel(e.target.checked ? [...sel, r.i] : sel.filter((x) => x !== r.i))} /></td><td className="font-mono text-xs">{r.ref}</td><td>{r.name}</td><td className="tnum">{r.old != null ? dh(r.old) : "—"} → {r.price != null ? <b>{dh(r.price)}</b> : "—"}</td><td className="tnum">{r.variation != null ? pct(r.variation) : ""}</td><td className="text-xs">{r.promo ? `${dh(r.promo.price)} (${dateFr(r.promo.start)}–${dateFr(r.promo.end)})` : ""}</td><td><StatusBadge s={r.state} />{r.msg && <span className="ml-1 text-xs text-muted-foreground">{r.msg}</span>}</td></tr>)}</tbody></table>
          </div>
          <h3 className="mt-6 font-display text-lg font-semibold">4. Appliquer</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => go(ready)}>{busy ? "Application des nouveaux prix…" : `Appliquer les lignes prêtes (${ready.length})`}</Button>
            <Button variant="outline" disabled={busy || !sel.length} onClick={() => go(sel)}>Appliquer la sélection ({sel.length})</Button>
            <Button variant="outline" onClick={() => { setRaw([]); toast.info("Import annulé"); }}>Annuler l'import</Button>
          </div>
        </Card>
      )}
      <Card>
        <h3 className="mb-3 font-display text-lg font-semibold">Historique des imports</h3>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-muted-foreground"><th>Fichier</th><th>Date</th><th>Auteur</th><th>Appliquées</th><th>Ignorées</th><th>Erreurs</th><th></th></tr></thead>
          <tbody>{db.imports.map((b) => <tr key={b.id} className="border-t"><td className="py-2 font-semibold">{b.file}</td><td>{dateTimeFr(b.at)}</td><td>{b.author}</td><td>{b.applied}</td><td>{b.ignored}</td><td>{b.errors}</td><td className="text-right">{b.undone ? <Pill>Annulé</Pill> : <Button size="sm" variant="outline" onClick={() => { if (!confirm(`Restaurer les anciens prix de « ${b.file} » ?`)) return; const r = undo(b.id); r.ok ? toast.success(r.msg) : toast.error(r.error); }}><Undo2 className="h-3 w-3" />Annuler cet import</Button>}</td></tr>)}</tbody></table>
      </Card>
    </div>
  );
}

function History() {
  const db = useStore((s) => s.db); const undo = useStore((s) => s.undoPrice); const { openTranscript } = useDrawers(); const nav = useNavigate();
  const pn = (id: string) => db.products.find((p) => p.id === id)?.name ?? "";
  return (
    <DataTable rows={db.priceHistory} exportName="historique-prix" search={(h) => `${pn(h.productId)} ${h.author}`}
      filters={[{ key: "o", label: "Origine", options: ["Import Excel", "WhatsApp Admin", "Manuel", "Fin de promo", "Annulation"], get: (h) => h.origin }, { key: "a", label: "Auteur", options: [...new Set(db.priceHistory.map((h) => h.author))], get: (h) => h.author }]}
      cols={[
        { key: "d", label: "Date", render: (h) => dateTimeFr(h.at), sort: (h) => h.at, exp: (h) => dateTimeFr(h.at) },
        { key: "p", label: "Produit", render: (h) => <span className="font-semibold">{pn(h.productId)}</span>, exp: (h) => pn(h.productId) },
        { key: "c", label: "Ancien → nouveau", render: (h) => <span className="tnum">{dh(h.old)} → <b>{dh(h.new)}</b></span>, exp: (h) => `${h.old} → ${h.new}` },
        { key: "v", label: "Variation", render: (h) => <span className={h.new < h.old ? "text-brand" : "text-success"}>{pct(((h.new - h.old) / h.old) * 100)}</span>, sort: (h) => (h.new - h.old) / h.old },
        { key: "o", label: "Origine", render: (h) => h.origin === "WhatsApp Admin" ? <AgentBadge agent="Agent Admin Prix" /> : <Pill>{h.origin}</Pill>, exp: (h) => h.origin },
        { key: "a", label: "Auteur", render: (h) => <span className="tnum text-xs">{h.author}</span>, exp: (h) => h.author },
        { key: "l", label: "Lot", render: (h) => h.batchId ? <button className="text-xs text-brand" onClick={() => nav({ to: "/produits", search: { onglet: "import" } })}>{db.imports.find((b) => b.id === h.batchId)?.file ?? "lot"}</button> : "" },
        { key: "x", label: "", render: (h) => (
          <div className="flex justify-end gap-1">
            {h.transcriptId && <Button size="sm" variant="ghost" onClick={() => openTranscript(h.transcriptId!)}><MessageCircle className="h-3 w-3" />Voir l'échange WhatsApp</Button>}
            {h.undone ? <Pill>Annulée</Pill> : h.origin !== "Annulation" && <Button size="sm" variant="outline" onClick={() => { let r = undo(h.id); if (!r.ok && r.error.includes("plus récente") && confirm(`${r.error}\nAnnuler quand même ?`)) r = undo(h.id, true); r.ok ? toast.success(r.msg) : toast.error(r.error); }}><Undo2 className="h-3 w-3" />Annuler</Button>}
          </div>) },
      ]} />
  );
}

function Categories() {
  const db = useStore((s) => s.db); const mut = useStore((s) => s.mut);
  const [dragI, setDragI] = useState<number | null>(null); const [nb, setNb] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="mb-3 font-display text-lg font-semibold">Catégories (glisser pour réordonner)</h3>
        {(["Électroménager", "Ameublement"] as const).map((cat) => (
          <div key={cat} className="mb-4"><div className="mb-1 text-xs font-bold uppercase text-muted-foreground">{cat}</div>
            {db.subs.map((s, i) => s.cat !== cat ? null : (
              <div key={s.sub} draggable onDragStart={() => setDragI(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => dragI != null && mut((d) => { const [x] = d.subs.splice(dragI, 1); d.subs.splice(i, 0, x); })}
                className="mb-1 flex cursor-grab items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-accent/40">
                <span>{s.sub} <span className="text-xs text-muted-foreground">{s.slug}</span></span>
                <span className="flex items-center gap-2"><Pill>{db.products.filter((p) => p.sub === s.sub).length} produits</Pill>
                  <button className="text-xs text-muted-foreground hover:text-brand" onClick={() => { const n = db.products.filter((p) => p.sub === s.sub).length; if (n) toast.error(`Impossible : ${n} produit(s) dans cette catégorie.`); }}>Supprimer</button></span>
              </div>))}
          </div>))}
      </Card>
      <Card>
        <h3 className="mb-3 font-display text-lg font-semibold">Marques</h3>
        {db.brands.map((b, i) => (
          <div key={b.name} className="mb-1 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-ink-foreground">{b.name}</span>
            <span className="flex-1 text-xs text-muted-foreground">{db.products.filter((p) => p.brand === b.name).length} produits · {db.tickets.filter((t) => db.products.find((p) => p.id === t.productId)?.brand === b.name).length} réclamations</span>
            <label className="flex items-center gap-1 text-xs">Garantie <Input type="number" className="h-7 w-14" value={b.warranty} onChange={(e) => mut((d) => { d.brands[i].warranty = +e.target.value; })} /> mois</label>
            <button className="text-xs text-muted-foreground hover:text-brand" onClick={() => { const n = db.products.filter((p) => p.brand === b.name).length; if (n) return toast.error(`Impossible : ${n} produit(s) liés à ${b.name}.`); mut((d) => { d.brands.splice(i, 1); }); }}>Supprimer</button>
          </div>))}
        <div className="mt-3 flex gap-2"><Input value={nb} onChange={(e) => setNb(e.target.value)} placeholder="Nouvelle marque" /><Button onClick={() => { if (!nb.trim()) return; if (db.brands.some((b) => b.name.toLowerCase() === nb.trim().toLowerCase())) return toast.error("Marque déjà existante"); mut((d) => { d.brands.push({ name: nb.trim(), warranty: 24, archived: false }); }); setNb(""); toast.success("Marque ajoutée"); }}>Ajouter</Button></div>
      </Card>
    </div>
  );
}
