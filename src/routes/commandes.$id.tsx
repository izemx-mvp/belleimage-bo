import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, MessageCircle, Truck, ShieldAlert, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, orderTotal, subtotal, ORDER_FLOW } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
import { dh, dateTimeFr, dayFr } from "@/lib/format";
import { orderPdf } from "@/lib/pdf";
import { Card, StatusBadge, SourceBadge, Pill } from "@/components/bi/ui";
import { ClientLink, useDrawers } from "@/components/bi/drawers";
import { PlanDialog, CollectDialog } from "@/components/bi/delivery-dialogs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/commandes/$id")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Fiche commande — Belle Image" }, { name: "description", content: "Détail d'une commande Belle Image." }, { property: "og:title", content: "Fiche commande — Belle Image" }, { property: "og:description", content: "Détail de commande." }] }),
  component: OrderDetail,
});
const FLOW: OrderStatus[] = ["Nouvelle", "Confirmée", "En préparation", "Prête", "En livraison", "Livrée & encaissée"];

function OrderDetail() {
  const { id } = Route.useParams(); const db = useStore((s) => s.db); const st = useStore.getState(); const nav = useNavigate();
  const { openTranscript } = useDrawers();
  const [plan, setPlan] = useState(false); const [collect, setCollect] = useState(false); const [addr, setAddr] = useState("");
  const o = db.orders.find((x) => x.id === id);
  if (!o) return <p>Commande introuvable. <Link to="/commandes" className="text-brand">Retour</Link></p>;
  const c = db.clients.find((x) => x.id === o.clientId)!;
  const dl = db.deliveries.find((x) => x.orderId === o.id && x.status !== "Reportée");
  const pay = db.payments.find((x) => x.orderId === o.id);
  const go = (to: OrderStatus) => { let reason: string | undefined; if (to === "Annulée" || to === "Retournée") { reason = prompt(to === "Annulée" ? "Motif d'annulation ?" : "Résultat du contrôle retour ?") ?? undefined; if (!reason) return; } const r = st.setOrderStatus(o.id, to, reason); r.ok ? toast.success(r.msg) : toast.error(r.error); };
  const tpl = (i: number) => st.sendWhatsApp(c.id, db.templates[i].text.replace("{client}", c.name).replace("{commande}", o.num), { orderId: o.id });
  const idx = FLOW.indexOf(o.status);
  return (
    <div className="space-y-6">
      <button onClick={() => nav({ to: "/commandes" })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Commandes</button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-4xl font-semibold">{o.num}</h1><StatusBadge s={o.status} pulse={o.status === "Nouvelle"} />{o.source === "WhatsApp" && <SourceBadge source="À confirmer" />}</div>
          <p className="mt-1 text-sm text-muted-foreground">{o.source} · {dateTimeFr(o.createdAt)} · {o.mode}</p>
        </div>
        <Card className="p-4 text-right"><div className="text-xs uppercase text-muted-foreground">{o.status === "Livrée & encaissée" ? "Encaissé" : "À payer à la livraison"}</div><div className="font-display text-3xl font-semibold text-brand tnum">{dh(orderTotal(o))}</div></Card>
      </div>
      {!["Annulée", "Retournée"].includes(o.status) && (
        <div className="flex items-center gap-1 overflow-x-auto">{FLOW.map((s, i) => <div key={s} className="flex flex-1 items-center gap-1"><div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold", i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i < idx ? <Check className="h-4 w-4" /> : i + 1}</div><span className="whitespace-nowrap text-xs font-semibold">{s}</span>{i < FLOW.length - 1 && <div className={cn("h-0.5 min-w-4 flex-1", i < idx ? "bg-primary" : "bg-border")} />}</div>)}</div>
      )}
      <div className="flex flex-wrap gap-2">
        {o.status === "Nouvelle" && <Button onClick={() => go("Confirmée")}>Confirmer (réserve le stock)</Button>}
        {o.status === "Confirmée" && <Button onClick={() => go("En préparation")}>Passer en préparation</Button>}
        {o.status === "En préparation" && <Button onClick={() => go("Prête")}>Marquer prête</Button>}
        {["Confirmée", "En préparation", "Prête"].includes(o.status) && o.mode === "Livraison à domicile" && <Button variant="outline" onClick={() => setPlan(true)}><Truck className="h-4 w-4" />{dl ? "Replanifier" : "Planifier la livraison"}</Button>}
        {o.status === "Prête" && dl?.status === "Planifiée" && <Button onClick={() => { const r = st.startDelivery(dl.id); r.ok ? toast.success(r.msg) : toast.error(r.error); }}>Démarrer la tournée</Button>}
        {o.status === "En livraison" && dl && <Button onClick={() => setCollect(true)}>Marquer livrée & encaisser</Button>}
        {ORDER_FLOW[o.status].includes("Annulée") && <Button variant="outline" onClick={() => go("Annulée")}>Annuler</Button>}
        {o.status === "Livrée & encaissée" && <><Button variant="outline" onClick={() => go("Retournée")}>Marquer retournée</Button><Button variant="outline" onClick={() => nav({ to: "/sav", search: { nouveau: c.id, commande: o.id } })}><ShieldAlert className="h-4 w-4" />Créer une réclamation</Button><Button variant="outline" onClick={() => orderPdf(db, o.id, "recu")}><FileText className="h-4 w-4" />Reçu PDF</Button></>}
        <Button variant="outline" onClick={() => orderPdf(db, o.id, "bon")}><FileText className="h-4 w-4" />Bon de livraison</Button>
        {o.transcriptId && <Button variant="outline" onClick={() => openTranscript(o.transcriptId!)}><MessageCircle className="h-4 w-4" />Voir l'échange WhatsApp</Button>}
      </div>
      {o.missing.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <p className="text-sm font-semibold text-warning">Informations manquantes : {o.missing.join(", ")}</p>
          <div className="mt-2 flex gap-2"><Input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Adresse complète" /><Button onClick={() => { if (addr.trim().length < 5) return toast.error("Adresse trop courte"); st.updateOrderClient(o.id, { address: addr.trim() }); toast.success("Adresse complétée"); }}>Enregistrer</Button></div>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-display text-lg font-semibold">Articles <Pill tone="muted" className="ml-2">Prix figé à la commande</Pill></h3>
          <table className="w-full text-sm"><tbody>{o.lines.map((l) => <tr key={l.productId} className="border-b"><td className="py-2">{l.name}</td><td className="text-center">×{l.qty}</td><td className="text-right tnum">{dh(l.unitPrice)}</td><td className="text-right font-semibold tnum">{dh(l.qty * l.unitPrice)}</td></tr>)}</tbody></table>
          <div className="mt-3 space-y-1 text-right text-sm"><div>Sous-total : <span className="tnum">{dh(subtotal(o))}</span></div><div>Livraison : <span className="tnum">{dh(o.fee)}</span></div><div className="font-display text-lg font-semibold">Total TTC : {dh(orderTotal(o))}</div></div>
          <h3 className="mb-2 mt-6 font-display text-lg font-semibold">Chronologie</h3>
          <ul className="space-y-2 border-l-2 border-brand/30 pl-4 text-sm">{o.history.map((h, i) => <li key={i}><span className="text-xs text-muted-foreground">{dateTimeFr(h.at)} · {h.actor}</span><div>{h.text}</div></li>)}</ul>
        </Card>
        <div className="space-y-4">
          <Card><h3 className="mb-2 font-display font-semibold">Client</h3><ClientLink id={c.id} /><p className="text-sm tnum">{c.phone}</p><p className="text-sm text-muted-foreground">{c.address}, {c.quartier} — {c.city}</p></Card>
          <Card><h3 className="mb-2 font-display font-semibold">Livraison</h3>{dl ? <div className="space-y-1 text-sm"><StatusBadge s={dl.status} /><div>{dl.num} · {dayFr(dl.date)} · {dl.slot}</div><div>Livreur : {db.drivers.find((d) => d.id === dl.driverId)?.name}</div>{dl.failReason && <div className="text-brand">Motif : {dl.failReason}</div>}<Link to="/livraisons" search={{ onglet: "liste" }} className="text-xs font-semibold text-brand">Voir dans Livraisons →</Link></div> : <p className="text-sm text-muted-foreground">{o.mode === "Retrait en magasin" ? "Retrait en magasin" : "Non planifiée"}</p>}</Card>
          <Card><h3 className="mb-2 font-display font-semibold">Paiement</h3>{pay?.at ? <div className="text-sm"><StatusBadge s={pay.status} /><p className="mt-1">Encaissé le {dateTimeFr(pay.at)} — {pay.mode} — {dh(pay.received ?? 0)}</p>{pay.gapReason && <p className="text-warning">Écart : {pay.gapReason}</p>}</div> : <p className="text-sm">À payer à la livraison</p>}</Card>
          <Card><h3 className="mb-2 font-display font-semibold">Message WhatsApp</h3><div className="flex flex-wrap gap-2">{[[0, "Confirmation"], [1, "En route"], [2, "Retard"]].map(([i, l]) => <Button key={l} size="sm" variant="outline" onClick={() => { tpl(i as number); toast.success(`Message WhatsApp envoyé à ${c.name}`); }}>{l}</Button>)}</div></Card>
        </div>
      </div>
      <PlanDialog orderId={plan ? o.id : null} onClose={() => setPlan(false)} />
      <CollectDialog deliveryId={collect && dl ? dl.id : null} onClose={() => setCollect(false)} />
    </div>
  );
}
