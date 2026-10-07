import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ImageIcon, Hand, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore, warrantyOf, TICKET_FLOW } from "@/lib/store";
import type { TicketStatus } from "@/lib/types";
import { dateFr, dateTimeFr } from "@/lib/format";
import { simplePdf } from "@/lib/pdf";
import { Card, StatusBadge, SourceBadge, Pill } from "@/components/bi/ui";
import { ClientLink, Bubbles } from "@/components/bi/drawers";

export const Route = createFileRoute("/sav/$id")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Fiche réclamation — Belle Image" }, { name: "description", content: "Détail d'une réclamation SAV." }, { property: "og:title", content: "Fiche réclamation — Belle Image" }, { property: "og:description", content: "Ticket SAV." }] }),
  component: TicketPage,
});
const TECHS = ["Rachid (technicien)", "Karim (technicien)", "Atelier Samsung agréé", "Atelier LG agréé"];

function TicketPage() {
  const { id } = Route.useParams(); const db = useStore((s) => s.db); const st = useStore.getState();
  const t = db.tickets.find((x) => x.id === id);
  const [reply, setReply] = useState(""); const [tech, setTech] = useState(t?.technician ?? TECHS[0]); const [date, setDate] = useState(t?.interventionDate ?? ""); const [lightbox, setLightbox] = useState(false);
  if (!t) return <p>Réclamation introuvable. <Link to="/sav" className="text-brand">Retour</Link></p>;
  const p = db.products.find((x) => x.id === t.productId)!; const o = db.orders.find((x) => x.id === t.orderId); const c = db.clients.find((x) => x.id === t.clientId)!;
  const w = warrantyOf(db, t);
  const go = (to: TicketStatus) => {
    const extra: Record<string, string> = {};
    if (to === "Technicien assigné") extra.technician = tech;
    if (to === "Intervention planifiée") { if (!date) return toast.error("Choisissez une date"); extra.interventionDate = date; }
    if (to === "Refusée — hors garantie") { const r = prompt("Motif du refus (hors garantie, mauvaise utilisation…) ?"); if (!r) return; extra.refuseReason = r; }
    if (to === "Résolue" && !t.solution) { const s = prompt("Solution (Réparation, Remplacement, Remboursement/avoir, Pièce à envoyer, Aucune) ?", "Réparation"); if (!s) return; extra.solution = s; }
    const r = st.setTicketStatus(t.id, to, extra); r.ok ? toast.success(`${r.msg} — client informé sur WhatsApp`) : toast.error(r.error);
  };
  return (
    <div className="space-y-6">
      <Link to="/sav" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Réclamations</Link>
       <div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-4xl font-semibold">{t.num}</h1><StatusBadge s={t.status} />{t.humanInCharge && <Pill tone="ink"><Hand className="h-3 w-3" />Responsable assigné</Pill>}</div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="border-brand/20 bg-accent/30"><div className="mb-1 text-xs font-bold uppercase text-brand">Résumé</div><p>{t.summary}</p></Card>
          <Card>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><div className="text-xs text-muted-foreground">Client</div><ClientLink id={c.id} /></div>
              <div><div className="text-xs text-muted-foreground">Produit</div><b>{p.name}</b> · {p.brand}</div>
              <div><div className="text-xs text-muted-foreground">Commande</div>{o ? <Link to="/commandes/$id" params={{ id: o.id }} className="text-brand">{o.num}</Link> : "—"}</div>
              <div><div className="text-xs text-muted-foreground">Livraison</div>{o?.deliveredAt ? dateFr(o.deliveredAt) : "—"}</div>
              <div className="sm:col-span-2"><div className="text-xs text-muted-foreground">Garantie ({p.warrantyMonths} mois)</div>{w.state === "ok" ? <span className="font-semibold text-success">✓ Couverte jusqu'au {dateFr(w.end!)} — {w.days} jours restants</span> : w.state === "expired" ? <span className="font-semibold text-brand">✗ Expirée depuis le {dateFr(w.end!)} — intervention payante à proposer, aucun geste gratuit promis.</span> : "? À vérifier (date de livraison inconnue)"}</div>
            </div>
            {t.photos > 0 && <div className="mt-4"><div className="text-xs text-muted-foreground">Photos du client</div><button onClick={() => setLightbox(!lightbox)} className={`mt-1 flex items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all ${lightbox ? "h-64 w-full" : "h-20 w-28"}`}><ImageIcon className="h-6 w-6" /></button></div>}
            <p className="mt-4 text-sm">{t.description}</p>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">Conversation WhatsApp</h3>{!t.humanInCharge && <Button size="sm" variant="outline" onClick={() => { st.updateTicket(t.id, { humanInCharge: true }); toast.info("Vous êtes responsable de ce dossier"); }}><Hand className="h-3 w-3" />Reprendre la main</Button>}</div>
            <Bubbles messages={t.messages} />
            <div className="mt-3 flex gap-2"><Textarea dir="auto" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Répondre au client…" className="min-h-10" /><Button disabled={!reply.trim()} onClick={() => { st.replyTicket(t.id, reply.trim()); setReply(""); toast.success(`Message WhatsApp envoyé à ${c.name}`); }}>Envoyer</Button></div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="space-y-3 text-sm">
            <h3 className="font-display text-lg font-semibold">Traitement</h3>
            <div className="flex flex-wrap gap-2">{TICKET_FLOW[t.status].map((s) => <Button key={s} size="sm" variant={s.startsWith("Refusée") ? "outline" : "default"} onClick={() => go(s)}>{s === "Clôturée" ? "Clôturer" : s.startsWith("Refusée") ? "Refuser" : `→ ${s}`}</Button>)}{!TICKET_FLOW[t.status].length && <span className="text-muted-foreground">Ticket terminé.</span>}</div>
            <div><Label>Priorité</Label><select value={t.priority} onChange={(e) => st.updateTicket(t.id, { priority: e.target.value as typeof t.priority })} className="h-9 w-full rounded-md border bg-card px-2">{["Basse", "Normale", "Haute"].map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><Label>Technicien</Label><select value={tech} onChange={(e) => { setTech(e.target.value); if (t.technician) st.updateTicket(t.id, { technician: e.target.value }); }} className="h-9 w-full rounded-md border bg-card px-2">{TECHS.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><Label>Intervention</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Solution</Label><select value={t.solution ?? ""} onChange={(e) => st.updateTicket(t.id, { solution: e.target.value })} className="h-9 w-full rounded-md border bg-card px-2"><option value="">—</option>{["Réparation", "Remplacement", "Remboursement/avoir", "Pièce à envoyer", "Aucune"].map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><Label>Notes internes</Label><Textarea value={t.notes} onChange={(e) => st.updateTicket(t.id, { notes: e.target.value })} /></div>
            {t.refuseReason && <p className="text-brand">Motif de refus : {t.refuseReason}</p>}
            <Button variant="outline" size="sm" onClick={() => simplePdf("FICHE D'INTERVENTION", [`Ticket : ${t.num}`, `Client : ${c.name} — ${c.phone}`, `Adresse : ${c.address}, ${c.quartier}, ${c.city}`, `Produit : ${p.name} (${p.brand})`, `Type : ${t.type}`, `Garantie : ${w.state === "ok" ? "couverte" : w.state === "expired" ? "expirée" : "à vérifier"}`, `Technicien : ${t.technician ?? "—"}`, `Date : ${t.interventionDate ? dateFr(t.interventionDate) : "—"}`, `Description : ${t.description}`], `intervention-${t.num}.pdf`)}><FileText className="h-3 w-3" />Fiche d'intervention PDF</Button>
          </Card>
           <Card className="text-sm"><h3 className="mb-2 font-display font-semibold">Chronologie</h3><ul className="space-y-1 border-l-2 border-brand/30 pl-3 text-xs">{t.messages.map((m, i) => <li key={i}>{dateTimeFr(m.at)} — {m.from === "team" || m.from === "human" ? "Équipe" : "Client"}</li>)}<li>{dateTimeFr(t.createdAt)} — Ticket créé ({t.source})</li></ul></Card>
        </div>
      </div>
    </div>
  );
}
