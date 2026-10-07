import { createContext, useContext, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCheck, ImageIcon, MessageCircle, Phone, Plus, ShieldAlert } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useStore, orderTotal } from "@/lib/store";
import type { Msg } from "@/lib/types";
import { dh, dateFr, timeFr, initials } from "@/lib/format";
import { StatusBadge, Pill } from "./ui";
import { cn } from "@/lib/utils";

interface Ctx { openClient: (id: string) => void; openTranscript: (id: string) => void }
const C = createContext<Ctx>({ openClient: () => {}, openTranscript: () => {} });
export const useDrawers = () => useContext(C);

export function Bubbles({ messages }: { messages: Msg[] }) {
  return (
    <div className="space-y-2 rounded-xl bg-[color-mix(in_oklch,var(--muted)_70%,var(--success)_6%)] p-3">
      {messages.map((m, i) => {
        const mine = m.from !== "client" && m.from !== "admin";
        return (
          <div key={i} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-soft", mine ? "rounded-br-sm bg-card" : "rounded-bl-sm bg-success/10")}>
              <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {m.from === "agent" ? "Belle Image" : m.from === "human" ? "Belle Image (humain)" : m.from === "admin" ? "Admin" : "Client"}
              </div>
              {m.image && <div className="mb-1 flex h-24 w-36 items-center justify-center rounded-lg bg-muted text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>}
              <p dir="auto" className="whitespace-pre-wrap">{m.text}</p>
              {m.buttons && <div className="mt-2 flex flex-wrap gap-1">{m.buttons.map((b) => <span key={b} className="rounded-full border px-2 py-0.5 text-xs text-info">{b}</span>)}</div>}
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">{timeFr(m.at)}{mine && <CheckCheck className="h-3 w-3 text-info" />}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DrawersProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<string | null>(null);
  const [tr, setTr] = useState<string | null>(null);
  return (
    <C.Provider value={{ openClient: setClient, openTranscript: setTr }}>
      {children}
      <ClientSheet id={client} onClose={() => setClient(null)} />
      <TranscriptSheet id={tr} onClose={() => setTr(null)} />
    </C.Provider>
  );
}

function TranscriptSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const t = useStore((s) => s.db.transcripts.find((x) => x.id === id));
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display">Échange WhatsApp</SheetTitle></SheetHeader>
        {t && (
          <div className="space-y-3 p-4 pt-0">
            <div className="text-sm"><b dir="auto">{t.clientName}</b> · <span className="tnum text-muted-foreground">{t.phone}</span></div>
            <Pill tone="muted">Lecture seule</Pill>
            <Bubbles messages={t.messages} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ClientSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const db = useStore((s) => s.db); const send = useStore((s) => s.sendWhatsApp);
  const [msg, setMsg] = useState("");
  const c = db.clients.find((x) => x.id === id);
  const orders = db.orders.filter((o) => o.clientId === id);
  const tickets = db.tickets.filter((t) => t.clientId === id);
  const reviews = db.reviews.filter((r) => r.clientId === id);
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {c && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand font-bold text-primary-foreground">{initials(c.name)}</div>
                <div><SheetTitle className="font-display text-xl" dir="auto">{c.name}</SheetTitle><p className="text-sm text-muted-foreground">Langue préférée : {c.lang}</p></div>
              </div>
            </SheetHeader>
            <div className="space-y-5 p-4 pt-0 text-sm">
              <div className="grid gap-1 rounded-xl border p-3">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand" /><span className="tnum">{c.phone}</span></div>
                <div>{c.address}, {c.quartier} — {c.city}</div>
                {c.landmark && <div className="text-muted-foreground">Repère : {c.landmark}</div>}
              </div>
              <section>
                <h4 className="mb-2 font-display text-base font-semibold">Commandes ({orders.length})</h4>
                <div className="space-y-1.5">{orders.map((o) => (
                  <Link key={o.id} to="/commandes/$id" params={{ id: o.id }} onClick={onClose} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-accent/50">
                    <span className="font-semibold">{o.num}</span><span className="tnum">{dh(orderTotal(o))}</span><StatusBadge s={o.status} />
                  </Link>))}
                </div>
              </section>
              <section>
                <h4 className="mb-2 font-display text-base font-semibold">Réclamations ({tickets.length})</h4>
                <div className="space-y-1.5">{tickets.map((t) => (
                  <Link key={t.id} to="/sav/$id" params={{ id: t.id }} onClick={onClose} className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-accent/50">
                    <span className="font-semibold">{t.num}</span><span>{t.type}</span><StatusBadge s={t.status} />
                  </Link>))}
                  {!tickets.length && <p className="text-muted-foreground">Aucune réclamation.</p>}
                </div>
              </section>
              {reviews.length > 0 && <section><h4 className="mb-2 font-display text-base font-semibold">Avis</h4>{reviews.map((r) => <div key={r.id} className="text-muted-foreground">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} — {r.comment} ({dateFr(r.at)})</div>)}</section>}
              <section className="space-y-2">
                <h4 className="font-display text-base font-semibold">Envoyer un message WhatsApp</h4>
                <Textarea dir="auto" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Votre message…" />
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!msg.trim()} onClick={() => { send(c.id, msg.trim()); setMsg(""); toast.success(`Message WhatsApp envoyé à ${c.name}`); }}><MessageCircle className="h-4 w-4" />Envoyer</Button>
                  <Button variant="outline" asChild><Link to="/commandes" search={{ nouveau: c.id, statut: undefined }} onClick={onClose}><Plus className="h-4 w-4" />Nouvelle commande</Link></Button>
                  <Button variant="outline" asChild><Link to="/sav" search={{ nouveau: c.id, commande: undefined }} onClick={onClose}><ShieldAlert className="h-4 w-4" />Créer une réclamation</Link></Button>
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function ClientLink({ id }: { id: string }) {
  const c = useStore((s) => s.db.clients.find((x) => x.id === id));
  const { openClient } = useDrawers();
  return <button dir="auto" onClick={(e) => { e.stopPropagation(); openClient(id); }} className="font-semibold underline-offset-2 hover:text-brand hover:underline">{c?.name ?? "—"}</button>;
}
