import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Trash2, Upload, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore, nowMs, effectivePrice, availableOf, type DB } from "@/lib/store";
import { feeFor } from "@/lib/seed";
import { dh, dateFr } from "@/lib/format";
import { PageHeader, Tabs, Card, Pill } from "@/components/bi/ui";

type Tab = "faq" | "documents" | "infos" | "regles";
export const Route = createFileRoute("/base-de-connaissance")({
  validateSearch: (s: Record<string, unknown>): { onglet?: Tab } => ({ onglet: (s.onglet as Tab) || undefined }),
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Base de connaissance — Belle Image" }, { name: "description", content: "FAQ, documents, infos et procédures du magasin." }, { property: "og:title", content: "Base de connaissance — Belle Image" }, { property: "og:description", content: "Informations de référence pour l’équipe Belle Image." }] }),
  component: KB,
});

function KB() {
  const s = Route.useSearch(); const nav = useNavigate({ from: "/base-de-connaissance" });
  const tab = s.onglet ?? "faq";
  return <div>
    <PageHeader title="Base de connaissance" />
    <Tabs value={tab} onChange={(v) => nav({ search: { onglet: v } })} items={[{ v: "faq", label: "FAQ" }, { v: "documents", label: "Documents" }, { v: "infos", label: "Infos générales" }, { v: "regles", label: "Règles du magasin" }]} />
    {tab === "faq" && <Faq />}{tab === "documents" && <Docs />}{tab === "infos" && <Infos />}{tab === "regles" && <Rules />}
  </div>;
}

function Faq() {
  const db = useStore((s) => s.db); const mut = useStore((s) => s.mut);
  const [cat, setCat] = useState(""); const [nq, setNq] = useState(""); const [na, setNa] = useState(""); const [nc, setNc] = useState("Commandes");
  const cats = ["Commandes", "Livraison", "Paiement", "Garantie & SAV", "Produits", "Magasin"];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">{["", ...cats].map((c) => <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${cat === c ? "border-brand bg-accent text-accent-foreground" : ""}`}>{c || "Toutes"}</button>)}</div>
        {db.faqs.filter((f) => !cat || f.cat === cat).map((f) => { const i = db.faqs.findIndex((x) => x.id === f.id); return (
          <Card key={f.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2"><Pill>{f.cat}</Pill><Input value={f.q} onChange={(e) => mut((d) => { d.faqs[i].q = e.target.value; })} className="font-semibold" /><Textarea dir="auto" value={f.a} onChange={(e) => mut((d) => { d.faqs[i].a = e.target.value; })} /></div>
              <div className="flex flex-col items-center gap-2"><Switch checked={f.active} onCheckedChange={(v) => mut((d) => { d.faqs[i].active = v; })} aria-label="Active" /><button onClick={() => { mut((d) => { d.faqs.splice(i, 1); }); toast.success("Entrée supprimée"); }} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-brand" /></button></div>
            </div>
          </Card>); })}
      </div>
      <Card className="h-fit space-y-2"><h3 className="font-display font-semibold">Ajouter une entrée</h3>
        <select value={nc} onChange={(e) => setNc(e.target.value)} className="h-9 w-full rounded-md border bg-card px-2 text-sm">{cats.map((c) => <option key={c}>{c}</option>)}</select>
        <Input value={nq} onChange={(e) => setNq(e.target.value)} placeholder="Question" /><Textarea value={na} onChange={(e) => setNa(e.target.value)} placeholder="Réponse" />
        <Button onClick={() => { if (!nq.trim() || !na.trim()) return toast.error("Question et réponse requises"); mut((d) => { d.faqs.unshift({ id: `f${Date.now()}`, cat: nc, q: nq, a: na, active: true }); }); setNq(""); setNa(""); toast.success("Entrée ajoutée"); }}><Plus className="h-4 w-4" />Ajouter</Button>
      </Card>
    </div>
  );
}

function Docs() {
  const db = useStore((s) => s.db); const mut = useStore((s) => s.mut);
  return (
    <Card>
      <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-sm"><Upload className="h-5 w-5 text-brand" />Téléverser un PDF
        <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const id = `doc${Date.now()}`; mut((d) => { d.docs.unshift({ id, name: f.name, size: f.size, at: new Date().toISOString(), indexed: false }); }); toast.success(`${f.name} (${(f.size / 1024).toFixed(0)} Ko) — indexation en cours`); setTimeout(() => mut((d) => { const x = d.docs.find((y) => y.id === id); if (x) x.indexed = true; }), 4000); e.target.value = ""; }} /></label>
      <table className="w-full text-sm"><tbody>{db.docs.map((d, i) => <tr key={d.id} className="border-t"><td className="py-2 font-semibold">{d.name}</td><td>{d.size > 1e6 ? `${(d.size / 1e6).toFixed(1)} Mo` : `${(d.size / 1e3).toFixed(0)} Ko`}</td><td>{dateFr(d.at)}</td><td>{d.indexed ? <Pill tone="success">Indexé</Pill> : <Pill tone="warning">En cours</Pill>}</td><td className="text-right"><Button size="sm" variant="ghost" onClick={() => toast.info(`Aperçu de « ${d.name} » — document de démonstration`)}>Prévisualiser</Button><Button size="sm" variant="ghost" onClick={() => mut((x) => { x.docs.splice(i, 1); })}><Trash2 className="h-3 w-3" /></Button></td></tr>)}</tbody></table>
    </Card>
  );
}

function Infos() {
  const db = useStore((s) => s.db); const mut = useStore((s) => s.mut); const st = db.settings;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><h3 className="mb-3 font-display text-lg font-semibold">Horaires</h3>
        {st.hours.map((h, i) => <div key={h.day} className="mb-1 flex items-center gap-2 text-sm"><span className="w-24">{h.day}</span><Input type="time" className="h-8 w-28" value={h.open} disabled={h.closed} onChange={(e) => mut((d) => { d.settings.hours[i].open = e.target.value; })} /><Input type="time" className="h-8 w-28" value={h.close} disabled={h.closed} onChange={(e) => mut((d) => { d.settings.hours[i].close = e.target.value; })} /><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={h.closed} onChange={(e) => mut((d) => { d.settings.hours[i].closed = e.target.checked; })} />Fermé</label></div>)}
        <p className="mt-2 text-xs text-muted-foreground">Exceptions : {st.exceptions.map((e) => `${e.date} — ${e.note}`).join(" · ")}</p>
      </Card>
      <Card className="space-y-2 text-sm"><h3 className="font-display text-lg font-semibold">Coordonnées</h3>
        {(["address", "phone", "whatsapp", "email"] as const).map((k) => <div key={k}><Label>{{ address: "Adresse", phone: "Téléphone", whatsapp: "WhatsApp", email: "E-mail" }[k]}</Label><Input value={st[k]} onChange={(e) => mut((d) => { d.settings[k] = e.target.value; })} /></div>)}
        <a className="text-xs font-semibold text-brand" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(st.address)}`}>Ouvrir dans Google Maps →</a>
        <h4 className="pt-2 font-semibold">Réseaux sociaux</h4>
        {st.socials.map((s, i) => <div key={s.name} className="flex items-center gap-2"><a href={s.url} target="_blank" rel="noreferrer" className="w-24 font-semibold text-brand">{s.name}</a><Input value={s.url} onChange={(e) => mut((d) => { d.settings.socials[i].url = e.target.value; })} /></div>)}
        <Link to="/livraisons" search={{ onglet: "livreurs" }} className="block pt-2 text-xs font-semibold text-brand">Zones et frais de livraison →</Link>
      </Card>
      <Card className="lg:col-span-2"><h3 className="mb-3 font-display text-lg font-semibold">Modèles de messages WhatsApp</h3>
        <div className="grid gap-3 md:grid-cols-2">{db.templates.map((t, i) => <div key={t.id}><Label>{t.name}</Label><Textarea value={t.text} onChange={(e) => mut((d) => { d.templates[i].text = e.target.value; })} /></div>)}</div>
        <p className="mt-2 text-xs text-muted-foreground">Variables : {"{client}"} {"{commande}"} {"{livreur}"} {"{creneau}"} {"{ticket}"} {"{date}"}</p>
      </Card>
    </div>
  );
}

function Rules() {
  const db = useStore((s) => s.db); const mut = useStore((s) => s.mut);
  return <div className="max-w-xl space-y-5">
    <h3 className="font-display text-xl font-semibold">Prix et validation</h3>
    <label className="flex items-center justify-between gap-3 text-sm">Seuil d’alerte de variation (±%)<Input type="number" min={1} className="w-24" value={db.settings.varThreshold} onChange={(e) => mut((d) => { d.settings.varThreshold = Math.max(1, +e.target.value); })} /></label>
    <label className="flex items-center justify-between gap-3 text-sm">Confirmation avant chaque modification<Switch checked disabled /></label>
    <p className="text-sm text-muted-foreground">Toute commande doit être confirmée par l’équipe. Les changements de prix sont tracés et annulables. Paiement à la livraison uniquement.</p>
  </div>;
}
