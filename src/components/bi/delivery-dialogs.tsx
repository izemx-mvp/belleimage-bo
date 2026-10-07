import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, nowMs } from "@/lib/store";
import { orderPdf } from "@/lib/pdf";
import type { Slot } from "@/lib/types";
import { dh } from "@/lib/format";

export function PlanDialog({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const db = useStore((s) => s.db); const plan = useStore((s) => s.planDelivery);
  const [date, setDate] = useState(""); const [slot, setSlot] = useState<Slot>("Matin"); const [drv, setDrv] = useState("d1");
  useEffect(() => { if (orderId) setDate(new Date(nowMs(db) + 86400000).toISOString().slice(0, 10)); }, [orderId]); // eslint-disable-line
  return (
    <Dialog open={!!orderId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Planifier la livraison</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Créneau</Label><select value={slot} onChange={(e) => setSlot(e.target.value as Slot)} className="h-10 w-full rounded-md border bg-card px-2">{["Matin", "Après-midi", "Soir"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><Label>Livreur</Label><select value={drv} onChange={(e) => setDrv(e.target.value)} className="h-10 w-full rounded-md border bg-card px-2">{db.drivers.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.status}</option>)}</select></div>
          <Button onClick={() => { const r = plan(orderId!, date, slot, drv); if (r.ok) { toast.success(r.msg); onClose(); } else toast.error(r.error); }}>Planifier</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function confetti() {
  const box = document.createElement("div"); box.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  for (let i = 0; i < 60; i++) {
    const s = document.createElement("span"); const c = i % 2 ? "var(--brand)" : "var(--gold)";
    s.style.cssText = `position:absolute;top:-10px;left:${Math.random() * 100}%;width:8px;height:12px;background:${c};border-radius:2px;transition:transform 1.8s cubic-bezier(.2,.6,.4,1),opacity 1.8s`;
    box.appendChild(s);
    requestAnimationFrame(() => { s.style.transform = `translate(${(Math.random() - 0.5) * 200}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`; s.style.opacity = "0.2"; });
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2000);
}

export function CollectDialog({ deliveryId, onClose }: { deliveryId: string | null; onClose: () => void }) {
  const db = useStore((s) => s.db); const collect = useStore((s) => s.collect);
  const dl = db.deliveries.find((d) => d.id === deliveryId);
  const pay = dl && db.payments.find((p) => p.orderId === dl.orderId && p.status === "À encaisser");
  const [rec, setRec] = useState(0); const [mode, setMode] = useState<"Espèces" | "Chèque" | "Carte bancaire (TPE)">("Espèces"); const [reason, setReason] = useState("");
  useEffect(() => { if (pay) { setRec(pay.expected); setReason(""); } }, [pay?.id]); // eslint-disable-line
  const gap = pay ? rec - pay.expected : 0;
  return (
    <Dialog open={!!deliveryId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Encaissement à la livraison</DialogTitle></DialogHeader>
        {pay ? (
          <div className="grid gap-3 text-sm">
            <div className="rounded-xl bg-muted p-3">Montant attendu : <b className="font-display text-xl text-brand">{dh(pay.expected)}</b></div>
            <div><Label>Montant reçu</Label><Input type="number" value={rec} onChange={(e) => setRec(+e.target.value)} /></div>
            <div><Label>Mode</Label><div className="flex flex-wrap gap-2">{(["Espèces", "Chèque", "Carte bancaire (TPE)"] as const).map((m) => <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>{m}</Button>)}</div></div>
            {gap !== 0 && <div><Label className="text-warning">Écart de {dh(gap)} — motif obligatoire</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
            <Button onClick={() => {
              const r = collect(deliveryId!, rec, mode, reason);
              if (!r.ok) return toast.error(r.error);
              toast.success("Livrée & encaissée — reçu généré, demande d'avis envoyée"); confetti();
              orderPdf(useStore.getState().db, dl!.orderId, "recu"); onClose();
            }}>Valider l'encaissement</Button>
          </div>
        ) : <p className="text-sm">Aucun montant à encaisser.</p>}
      </DialogContent>
    </Dialog>
  );
}
