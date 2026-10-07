import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildSeed, feeFor, iso, dayKey } from "./seed";
import type { Order, OrderStatus, Product, Ticket, TicketStatus, Msg, Slot, Activity, Notif, PriceChange } from "./types";

export type DB = ReturnType<typeof buildSeed>;
const DAY = 86400000;

export const nowMs = (db: DB) => Date.now() + db.dayOffset * DAY;

export function effectivePrice(p: Product, now: number) {
  if (p.promo) {
    const t = dayKey(now);
    if (t >= p.promo.start && t <= p.promo.end) return p.promo.price;
  }
  return p.price;
}
export const promoActive = (p: Product, now: number) => effectivePrice(p, now) !== p.price;
const RESERVING: OrderStatus[] = ["Confirmée", "En préparation", "Prête", "En livraison"];
export function reservedOf(db: DB, productId: string) {
  return db.orders.filter((o) => RESERVING.includes(o.status)).flatMap((o) => o.lines).filter((l) => l.productId === productId).reduce((s, l) => s + l.qty, 0);
}
export const availableOf = (db: DB, p: Product) => p.stock - reservedOf(db, p.id);
export function stockStatus(db: DB, p: Product): "En stock" | "Stock bas" | "Rupture" {
  const a = availableOf(db, p);
  if (a <= 0) return "Rupture";
  if (a <= p.threshold) return "Stock bas";
  return "En stock";
}
export const subtotal = (o: Order) => o.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
export const orderTotal = (o: Order) => subtotal(o) + o.fee;

export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  "Nouvelle": ["Confirmée", "Annulée"],
  "Confirmée": ["En préparation", "Annulée"],
  "En préparation": ["Prête", "Annulée"],
  "Prête": ["En livraison", "Annulée"],
  "En livraison": [],
  "Livrée & encaissée": ["Retournée"],
  "Annulée": [], "Retournée": [],
};
export const TICKET_FLOW: Record<TicketStatus, TicketStatus[]> = {
  "Nouvelle": ["En analyse", "Refusée — hors garantie"],
  "En analyse": ["Technicien assigné", "Résolue", "Refusée — hors garantie"],
  "Technicien assigné": ["Intervention planifiée", "Résolue"],
  "Intervention planifiée": ["Résolue"],
  "Résolue": ["Clôturée"], "Clôturée": [], "Refusée — hors garantie": ["Clôturée"],
};

export function warrantyOf(db: DB, t: Ticket) {
  const o = db.orders.find((x) => x.id === t.orderId);
  const p = db.products.find((x) => x.id === t.productId);
  if (!o?.deliveredAt || !p) return { state: "?" as const, end: null as string | null, days: 0 };
  const end = new Date(o.deliveredAt); end.setMonth(end.getMonth() + p.warrantyMonths);
  const days = Math.ceil((end.getTime() - nowMs(db)) / DAY);
  return { state: days >= 0 ? ("ok" as const) : ("expired" as const), end: iso(end.getTime()), days };
}

type Res = { ok: true; msg?: string } | { ok: false; error: string };
const OK = (msg?: string): Res => ({ ok: true, msg });
const ERR = (error: string): Res => ({ ok: false, error });
let n = 1000;
const id = (p: string) => `${p}${Date.now().toString(36)}${(n++).toString(36)}`;
const fmt = (v: number) => new Intl.NumberFormat("fr-FR").format(v);

interface State {
  db: DB; session: { email: string } | null; pulse: number;
  login: (email: string, pass: string) => Res; logout: () => void; reset: () => void;
  mut: (fn: (d: DB) => void) => void;
  readAllNotifs: () => void;
  setOrderStatus: (orderId: string, to: OrderStatus, reason?: string, actor?: string) => Res;
  createOrder: (o: { clientId: string; lines: { productId: string; qty: number; discount?: number }[]; mode: Order["mode"]; notes: string; newClient?: DB["clients"][number] }) => Res & { id?: string };
  updateOrderClient: (orderId: string, patch: Partial<DB["clients"][number]>) => void;
  planDelivery: (orderId: string, date: string, slot: Slot, driverId: string) => Res;
  moveDelivery: (deliveryId: string, date: string, slot: Slot, driverId: string) => Res;
  startDelivery: (deliveryId: string) => Res;
  failDelivery: (deliveryId: string, reason: string) => Res;
  collect: (deliveryId: string, received: number, mode: NonNullable<DB["payments"][number]["mode"]>, gapReason: string) => Res;
  remit: (paymentIds: string[]) => Res;
  setPrice: (productId: string, price: number, origin: PriceChange["origin"], author: string, extra?: Partial<PriceChange>) => Res;
  undoPrice: (historyId: string, force?: boolean) => Res;
  applyImport: (file: string, rows: { productId: string; price: number; promo?: { price: number; start: string; end: string }; imageUrl?: string }[], ignored: number, errors: number) => Res;
  undoImport: (batchId: string) => Res;
  saveProduct: (p: Product) => Res;
  receive: (supplier: string, bl: string, lines: { productId: string; qty: number }[]) => Res;
  adjust: (productId: string, qty: number, reason: string, type?: "Ajustement" | "Inventaire") => Res;
  setThreshold: (productId: string, v: number) => void;
  sendWhatsApp: (clientId: string, text: string, ref?: { orderId?: string; ticketId?: string }) => void;
  createTicket: (t: Partial<Ticket> & { clientId: string; productId: string; type: string; description: string }, actor?: string) => Res & { id?: string };
  setTicketStatus: (ticketId: string, to: TicketStatus, extra?: Partial<Ticket>) => Res;
  updateTicket: (ticketId: string, patch: Partial<Ticket>) => void;
  replyTicket: (ticketId: string, text: string) => void;
  addReview: (orderId: string, rating: number, comment: string) => void;
  advanceDays: (n: number) => void;
}

export function log(d: DB, actor: string, kind: Activity["kind"], text: string) {
  d.activity.unshift({ id: id("a"), at: iso(nowMs(d)), actor, kind, text });
}
export function notify(d: DB, text: string, level: Notif["level"] = "info", link?: string) {
  d.notifications.unshift({ id: id("n"), at: iso(nowMs(d)), text, read: false, level, link });
}
function checkStockAlert(d: DB, productId: string) {
  const p = d.products.find((x) => x.id === productId)!;
  const st = stockStatus(d, p);
  if (st !== "En stock") notify(d, `${st === "Rupture" ? "Rupture" : "Stock bas"} : ${p.name} (disponible ${availableOf(d, p)})`, st === "Rupture" ? "danger" : "warn", "/stock");
}
function addMsgToClientTranscript(d: DB, clientId: string, msg: Msg, orderId?: string, ticketId?: string) {
  if (ticketId) { d.tickets.find((t) => t.id === ticketId)?.messages.push(msg); return; }
  const c = d.clients.find((x) => x.id === clientId)!;
  const o = orderId ? d.orders.find((x) => x.id === orderId) : undefined;
  let t = o?.transcriptId ? d.transcripts.find((x) => x.id === o.transcriptId) : undefined;
  if (!t) {
    t = { id: id("t"), title: o ? `Échange — ${o.num}` : `Échange — ${c.name}`, clientName: c.name, phone: c.phone, messages: [] };
    d.transcripts.push(t); if (o) o.transcriptId = t.id;
  }
  t.messages.push(msg);
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const mut = (fn: (d: DB) => void) => set((s) => { const d = structuredClone(s.db); fn(d); return { db: d, pulse: s.pulse + 1 }; });
      const run = (fn: (d: DB) => Res): Res => {
        const d = structuredClone(get().db); const r = fn(d);
        if (r.ok) set((s) => ({ db: d, pulse: s.pulse + 1 }));
        return r;
      };
      return {
        db: buildSeed(), session: null, pulse: 0, mut,
        login: (email, pass) => {
          if (email.trim().toLowerCase() !== "admin@belleimage.ma" || pass !== "demo123") return ERR("Identifiants incorrects. Utilisez admin@belleimage.ma / demo123.");
          set({ session: { email } }); return OK();
        },
        logout: () => set({ session: null }),
        reset: () => set((s) => ({ db: buildSeed(), pulse: s.pulse + 1 })),
        readAllNotifs: () => mut((d) => d.notifications.forEach((x) => (x.read = true))),

        setOrderStatus: (orderId, to, reason, actor = "Salma") => run((d) => {
          const o = d.orders.find((x) => x.id === orderId); if (!o) return ERR("Commande introuvable");
          if (!ORDER_FLOW[o.status].includes(to)) {
            if (to === "Livrée & encaissée") return ERR("« Livrée & encaissée » s'obtient uniquement via l'encaissement à la livraison.");
            return ERR(`Transition impossible : ${o.status} → ${to}.`);
          }
          if (to === "Confirmée") {
            if (o.missing.length) return ERR(`Informations manquantes : ${o.missing.join(", ")}. Complétez-les avant de confirmer.`);
            for (const l of o.lines) {
              const p = d.products.find((x) => x.id === l.productId)!;
              const a = availableOf(d, p);
              if (l.qty > a) return ERR(`Stock insuffisant pour ${p.name} : ${a} disponible(s), ${l.qty} demandé(s).`);
            }
          }
          if (to === "En livraison") {
            const dl = d.deliveries.find((x) => x.orderId === o.id && ["Planifiée", "Reportée"].includes(x.status));
            if (!dl) return ERR("« En livraison » exige une livraison planifiée. Planifiez-la d'abord.");
            dl.status = "En route";
          }
          if (to === "Annulée") {
            if (!reason) return ERR("Motif d'annulation obligatoire.");
            o.cancelReason = reason;
            d.deliveries.filter((x) => x.orderId === o.id).forEach((x) => (x.status = "Reportée"));
            d.payments = d.payments.filter((p) => !(p.orderId === o.id && p.status === "À encaisser"));
          }
          if (to === "Retournée") {
            o.lines.forEach((l) => {
              const p = d.products.find((x) => x.id === l.productId)!;
              d.movements.unshift({ id: id("m"), productId: p.id, type: "Retour client", qty: l.qty, before: p.stock, after: p.stock + l.qty, reason: reason || "Retour contrôlé", at: iso(nowMs(d)), author: actor });
              p.stock += l.qty;
            });
          }
          const from = o.status; o.status = to;
          o.history.push({ at: iso(nowMs(d)), text: `${from} → ${to}${reason ? ` (${reason})` : ""}`, actor });
          log(d, actor, "Commandes", `${o.num} : ${from} → ${to}.`);
          if (to === "Confirmée") {
            const c = d.clients.find((x) => x.id === o.clientId)!;
            addMsgToClientTranscript(d, c.id, { from: "team", text: d.templates[0].text.replace("{client}", c.name).replace("{commande}", o.num), at: iso(nowMs(d)) }, o.id);
            o.lines.forEach((l) => checkStockAlert(d, l.productId));
          }
          return OK(to === "Confirmée" ? "Commande confirmée — stock réservé, message WhatsApp envoyé." : `Statut mis à jour : ${to}`);
        }),

        createOrder: ({ clientId, lines, mode, notes, newClient }) => {
          let newId = "";
          const r = run((d) => {
            if (newClient) d.clients.push(newClient);
            const c = d.clients.find((x) => x.id === clientId); if (!c) return ERR("Client introuvable");
            if (!lines.length) return ERR("Ajoutez au moins un produit.");
            const now = nowMs(d);
            const ls = lines.map((l) => { const p = d.products.find((x) => x.id === l.productId)!; return { productId: p.id, name: p.name, qty: l.qty, unitPrice: Math.max(0, effectivePrice(p, now) - (l.discount ?? 0)) }; });
            const sub = ls.reduce((s, l) => s + l.qty * l.unitPrice, 0);
            const fee = mode === "Retrait en magasin" ? 0 : feeFor(c, sub, d.zones) ?? 0;
            const num = `CMD-2026-${String(Math.max(...d.orders.map((o) => +o.num.slice(-4))) + 1).padStart(4, "0")}`;
            newId = id("o");
            d.orders.unshift({ id: newId, num, clientId, lines: ls, fee, status: "Nouvelle", source: "Magasin", mode, createdAt: iso(now), missing: [], notes, owner: "Salma", history: [{ at: iso(now), text: "Commande créée", actor: "Salma" }] });
            log(d, "Salma", "Commandes", `Commande ${num} créée (${fmt(sub + fee)} DH).`);
            return OK(`Commande ${num} créée`);
          });
          return { ...r, id: newId };
        },
        updateOrderClient: (orderId, patch) => mut((d) => {
          const o = d.orders.find((x) => x.id === orderId)!; const c = d.clients.find((x) => x.id === o.clientId)!;
          Object.assign(c, patch);
          if (patch.address) o.missing = o.missing.filter((m) => m !== "adresse");
          if (patch.phone) o.missing = o.missing.filter((m) => m !== "téléphone");
        }),

        planDelivery: (orderId, date, slot, driverId) => run((d) => {
          const o = d.orders.find((x) => x.id === orderId)!;
          if (!["Confirmée", "En préparation", "Prête"].includes(o.status)) return ERR("Seule une commande confirmée peut être planifiée.");
          const load = d.deliveries.filter((x) => x.date === date && x.slot === slot && x.driverId === driverId && !["Échec", "Reportée", "Livrée"].includes(x.status)).length;
          if (load >= d.settings.capacity) return ERR(`Capacité atteinte : ${d.settings.capacity} livraisons max par livreur et par créneau.`);
          const existing = d.deliveries.find((x) => x.orderId === orderId && x.status !== "Livrée");
          if (existing) Object.assign(existing, { date, slot, driverId, status: "Planifiée", failReason: undefined });
          else d.deliveries.unshift({ id: id("l"), num: `LIV-2026-${String(d.deliveries.length + 100).padStart(4, "0")}`, orderId, date, slot, driverId, status: "Planifiée", loaded: [] });
          if (!d.payments.find((p) => p.orderId === orderId)) d.payments.unshift({ id: id("pay"), num: `ENC-${d.payments.length + 400}`, orderId, driverId, expected: orderTotal(o), status: "À encaisser" });
          else d.payments.filter((p) => p.orderId === orderId && p.status === "À encaisser").forEach((p) => (p.driverId = driverId));
          const drv = d.drivers.find((x) => x.id === driverId)!;
          log(d, "Salma", "Livraisons", `Livraison de ${o.num} planifiée le ${date.split("-").reverse().join("/")} (${slot}) avec ${drv.name}.`);
          return OK("Livraison planifiée");
        }),
        moveDelivery: (deliveryId, date, slot, driverId) => run((d) => {
          const dl = d.deliveries.find((x) => x.id === deliveryId)!;
          if (["Livrée", "En route"].includes(dl.status)) return ERR("Livraison déjà en route ou livrée : déplacement impossible.");
          const load = d.deliveries.filter((x) => x.id !== deliveryId && x.date === date && x.slot === slot && x.driverId === driverId && !["Échec", "Reportée", "Livrée"].includes(x.status)).length;
          if (load >= d.settings.capacity) return ERR(`Créneau complet pour ce livreur (${d.settings.capacity} max).`);
          Object.assign(dl, { date, slot, driverId, status: "Planifiée" });
          d.payments.filter((p) => p.orderId === dl.orderId && p.status === "À encaisser").forEach((p) => (p.driverId = driverId));
          log(d, "Salma", "Livraisons", `${dl.num} déplacée : ${date.split("-").reverse().join("/")} · ${slot}.`);
          return OK("Livraison replanifiée");
        }),
        startDelivery: (deliveryId) => run((d) => {
          const dl = d.deliveries.find((x) => x.id === deliveryId)!; const o = d.orders.find((x) => x.id === dl.orderId)!;
          if (dl.status !== "Planifiée") return ERR("Seule une livraison planifiée peut démarrer.");
          if (o.status !== "Prête") return ERR(`La commande doit être « Prête » (actuellement « ${o.status} »).`);
          dl.status = "En route"; o.status = "En livraison"; o.history.push({ at: iso(nowMs(d)), text: "Prête → En livraison", actor: "Salma" });
          const drv = d.drivers.find((x) => x.id === dl.driverId)!; drv.status = "En tournée";
          const window = dl.slot === "Matin" ? "entre 09:00 et 13:00" : dl.slot === "Après-midi" ? "entre 14:00 et 16:00" : "entre 18:00 et 21:00";
          addMsgToClientTranscript(d, o.clientId, { from: "team", text: `Votre commande ${o.num} est en route avec ${drv.name}. Arrivée prévue ${window}.`, at: iso(nowMs(d)) }, o.id);
          log(d, drv.name, "Livraisons", `${dl.num} en route (${o.num}).`);
          return OK("Tournée démarrée — message « en route » envoyé au client.");
        }),
        failDelivery: (deliveryId, reason) => run((d) => {
          const dl = d.deliveries.find((x) => x.id === deliveryId)!; const o = d.orders.find((x) => x.id === dl.orderId)!;
          if (!reason) return ERR("Motif obligatoire.");
          dl.status = "Échec"; dl.failReason = reason; if (o.status === "En livraison") o.status = "Prête";
          o.history.push({ at: iso(nowMs(d)), text: `Échec de livraison : ${reason}`, actor: "Livreur" });
          log(d, "Salma", "Livraisons", `${dl.num} en échec : ${reason}. Stock toujours réservé.`);
          notify(d, `Échec de livraison ${dl.num} — à replanifier`, "warn", "/livraisons?onglet=liste");
          return OK("Échec enregistré — à replanifier");
        }),
        collect: (deliveryId, received, mode, gapReason) => run((d) => {
          const dl = d.deliveries.find((x) => x.id === deliveryId)!; const o = d.orders.find((x) => x.id === dl.orderId)!;
          if (dl.status !== "En route") return ERR("La livraison doit être « En route » pour être encaissée.");
          const p = d.payments.find((x) => x.orderId === o.id && x.status === "À encaisser"); if (!p) return ERR("Aucun encaissement attendu.");
          const gap = received - p.expected;
          if (gap !== 0 && !gapReason.trim()) return ERR("Un écart nécessite un motif.");
          const now = iso(nowMs(d));
          Object.assign(p, { received, mode, at: now, status: gap === 0 ? "Encaissé" : "Écart", gapReason: gap ? gapReason : undefined, driverId: dl.driverId });
          dl.status = "Livrée"; o.status = "Livrée & encaissée"; o.deliveredAt = now;
          o.history.push({ at: now, text: `Livrée & encaissée (${fmt(received)} DH, ${mode})`, actor: d.drivers.find((x) => x.id === dl.driverId)!.name });
          o.lines.forEach((l) => {
            const pr = d.products.find((x) => x.id === l.productId)!;
            d.movements.unshift({ id: id("m"), productId: pr.id, type: "Sortie livraison", qty: -l.qty, before: pr.stock, after: pr.stock - l.qty, reason: o.num, at: now, author: "Système" });
            pr.stock -= l.qty;
          });
          addMsgToClientTranscript(d, o.clientId, { from: "team", text: d.templates[5].text, at: now, buttons: ["1", "2", "3", "4", "5"] }, o.id);
          log(d, d.drivers.find((x) => x.id === dl.driverId)!.name, "Livraisons", `Livraison ${dl.num} encaissée : ${fmt(received)} DH.`);
          notify(d, `${o.num} livrée & encaissée (${fmt(received)} DH)`, "success", `/commandes/${o.id}`);
          return OK("Livrée & encaissée");
        }),
        remit: (ids) => run((d) => {
          const ps = d.payments.filter((p) => ids.includes(p.id) && (p.status === "Encaissé" || p.status === "Écart"));
          if (!ps.length) return ERR("Aucun encaissement à reverser.");
          ps.forEach((p) => (p.status = "Reversé"));
          const total = ps.reduce((s, p) => s + (p.received ?? 0), 0);
          log(d, "Salma", "Livraisons", `Remise de caisse : ${fmt(total)} DH reversés (${ps.length} encaissements).`);
          return OK(`${fmt(total)} DH reversés`);
        }),

        setPrice: (productId, price, origin, author, extra = {}) => run((d) => {
          const p = d.products.find((x) => x.id === productId)!;
          if (!(price > 0)) return ERR("Prix invalide.");
          if (price === p.price) return ERR("Le prix est identique.");
          d.priceHistory.unshift({ id: id("h"), productId, old: p.price, new: price, origin, author, at: iso(nowMs(d)), ...extra });
          const old = p.price; p.price = price;
          log(d, origin === "WhatsApp Admin" ? "Administration" : author, "Prix", `${origin === "WhatsApp Admin" ? "Administration a modifié" : "Prix modifié pour"} ${p.name} : ${fmt(old)} → ${fmt(price)} DH.`);
          return OK(`Prix mis à jour : ${fmt(price)} DH`);
        }),
        undoPrice: (hid, force) => run((d) => {
          const h = d.priceHistory.find((x) => x.id === hid)!; if (h.undone) return ERR("Déjà annulée.");
          const newer = d.priceHistory.find((x) => x.productId === h.productId && x.at > h.at && !x.undone && x.id !== hid);
          if (newer && !force) return ERR("Une modification plus récente existe pour ce produit.");
          const p = d.products.find((x) => x.id === h.productId)!;
          d.priceHistory.unshift({ id: id("h"), productId: p.id, old: p.price, new: h.old, origin: "Annulation", author: "Salma Berrada", at: iso(nowMs(d)) });
          h.undone = true; p.price = h.old;
          log(d, "Salma", "Prix", `Modification annulée : ${p.name} revient à ${fmt(h.old)} DH.`);
          return OK("Ancien prix restauré");
        }),
        applyImport: (file, rows, ignored, errors) => run((d) => {
          if (!rows.length) return ERR("Aucune ligne à appliquer.");
          const bid = id("b"); const changes: { productId: string; old: number; new: number }[] = [];
          rows.forEach((r) => {
            const p = d.products.find((x) => x.id === r.productId)!;
            if (r.price !== p.price) {
              changes.push({ productId: p.id, old: p.price, new: r.price });
              d.priceHistory.unshift({ id: id("h"), productId: p.id, old: p.price, new: r.price, origin: "Import Excel", author: "Salma Berrada", at: iso(nowMs(d)), batchId: bid });
              p.price = r.price;
            }
            if (r.promo) p.promo = r.promo;
            if (r.imageUrl) p.imageUrl = r.imageUrl;
          });
          d.imports.unshift({ id: bid, file, at: iso(nowMs(d)), author: "Salma Berrada", applied: changes.length, ignored, errors, changes, undone: false });
          log(d, "Salma", "Import", `Import Excel « ${file} » : ${changes.length} prix mis à jour.`);
          notify(d, `Import Excel appliqué : ${changes.length} prix modifiés`, "success", "/produits?onglet=historique");
          return OK(`${changes.length} prix modifiés`);
        }),
        undoImport: (bid) => run((d) => {
          const b = d.imports.find((x) => x.id === bid)!; if (b.undone) return ERR("Import déjà annulé.");
          b.changes.forEach((c) => {
            const p = d.products.find((x) => x.id === c.productId)!;
            d.priceHistory.unshift({ id: id("h"), productId: p.id, old: p.price, new: c.old, origin: "Annulation", author: "Salma Berrada", at: iso(nowMs(d)), batchId: bid });
            p.price = c.old;
          });
          d.priceHistory.filter((h) => h.batchId === bid && h.origin === "Import Excel").forEach((h) => (h.undone = true));
          b.undone = true;
          log(d, "Salma", "Import", `Import « ${b.file} » annulé : ${b.changes.length} prix restaurés.`);
          return OK("Import annulé, anciens prix restaurés");
        }),
        saveProduct: (p) => run((d) => {
          const i = d.products.findIndex((x) => x.id === p.id);
          if (d.products.some((x) => x.ref === p.ref && x.id !== p.id)) return ERR("Cette référence existe déjà.");
          if (i >= 0) {
            const old = d.products[i];
            if (old.price !== p.price) d.priceHistory.unshift({ id: id("h"), productId: p.id, old: old.price, new: p.price, origin: "Manuel", author: "Salma Berrada", at: iso(nowMs(d)) });
            d.products[i] = p;
          } else d.products.unshift(p);
          log(d, "Salma", "Prix", `Produit ${p.ref} enregistré.`);
          return OK("Produit enregistré");
        }),
        receive: (supplier, bl, lines) => run((d) => {
          const ls = lines.filter((l) => l.qty > 0); if (!ls.length) return ERR("Ajoutez au moins une ligne.");
          ls.forEach((l) => {
            const p = d.products.find((x) => x.id === l.productId)!;
            d.movements.unshift({ id: id("m"), productId: p.id, type: "Entrée fournisseur", qty: l.qty, before: p.stock, after: p.stock + l.qty, reason: `${supplier} — ${bl}`, at: iso(nowMs(d)), author: "Salma" });
            p.stock += l.qty;
          });
          log(d, "Salma", "Stock", `Réception fournisseur ${bl} (${supplier}) : ${ls.length} ligne(s).`);
          return OK("Réception enregistrée");
        }),
        adjust: (productId, qty, reason, type = "Ajustement") => run((d) => {
          if (!reason.trim()) return ERR("Motif obligatoire.");
          const p = d.products.find((x) => x.id === productId)!;
          if (p.stock + qty < 0) return ERR("Le stock ne peut pas devenir négatif.");
          d.movements.unshift({ id: id("m"), productId, type, qty, before: p.stock, after: p.stock + qty, reason, at: iso(nowMs(d)), author: "Salma" });
          p.stock += qty; log(d, "Salma", "Stock", `${type} ${p.name} : ${qty > 0 ? "+" : ""}${qty} (${reason}).`);
          checkStockAlert(d, productId);
          return OK("Stock ajusté");
        }),
        setThreshold: (pid, v) => mut((d) => { d.products.find((x) => x.id === pid)!.threshold = Math.max(0, v); }),
        sendWhatsApp: (clientId, text, ref) => mut((d) => {
          addMsgToClientTranscript(d, clientId, { from: "human", text, at: iso(nowMs(d)) }, ref?.orderId, ref?.ticketId);
          log(d, "Salma", "Messages", `Message WhatsApp envoyé à ${d.clients.find((c) => c.id === clientId)!.name}.`);
        }),

        createTicket: (t, actor = "Salma") => {
          let tid = "";
          const r = run((d) => {
            tid = id("s");
            const num = `SAV-${String(d.tickets.length + 1).padStart(4, "0")}`;
            d.tickets.unshift({ id: tid, num, status: "Nouvelle", priority: "Normale", createdAt: iso(nowMs(d)), source: "Magasin", summary: t.description, humanInCharge: false, messages: [], photos: 0, notes: "", owner: "Houda (SAV)", ...t } as Ticket);
            log(d, actor, "SAV", `Réclamation ${num} créée.`);
            notify(d, `Nouvelle réclamation ${num}`, "warn", `/sav/${tid}`);
            return OK(`Réclamation ${num} créée`);
          });
          return { ...r, id: tid };
        },
        setTicketStatus: (tid, to, extra = {}) => run((d) => {
          const t = d.tickets.find((x) => x.id === tid)!;
          if (!TICKET_FLOW[t.status].includes(to)) return ERR(`Transition impossible : ${t.status} → ${to}.`);
          if (to === "Technicien assigné" && !(extra.technician || t.technician)) return ERR("Choisissez un technicien.");
          if (to === "Intervention planifiée" && !(extra.interventionDate || t.interventionDate)) return ERR("Choisissez une date d'intervention.");
          if (to === "Refusée — hors garantie" && !(extra.refuseReason || t.refuseReason)) return ERR("Motif de refus obligatoire.");
          Object.assign(t, extra); const from = t.status; t.status = to;
          const c = d.clients.find((x) => x.id === t.clientId)!;
          t.messages.push({ from: t.humanInCharge ? "human" : "team", text: `Bonjour ${c.name}, votre réclamation ${t.num} est maintenant : ${to}.${to === "Clôturée" ? " Merci de noter notre service de 1 à 5." : ""}`, at: iso(nowMs(d)) });
          log(d, "Houda", "SAV", `${t.num} : ${from} → ${to}.`);
          return OK(`Statut : ${to}`);
        }),
        updateTicket: (tid, patch) => mut((d) => { Object.assign(d.tickets.find((x) => x.id === tid)!, patch); }),
        replyTicket: (tid, text) => mut((d) => {
          const t = d.tickets.find((x) => x.id === tid)!; t.humanInCharge = true;
          t.messages.push({ from: "human", text, at: iso(nowMs(d)) });
          log(d, "Houda", "SAV", `Réponse de l’équipe sur ${t.num}.`);
        }),
        addReview: (orderId, rating, comment) => {
          let make = false; let o: Order | undefined;
          mut((d) => {
            o = d.orders.find((x) => x.id === orderId)!;
            d.reviews.unshift({ id: id("r"), clientId: o.clientId, orderId, rating, comment, at: iso(nowMs(d)) });
            make = rating <= 2 && d.settings.lowRatingTicket;
            notify(d, `Nouvel avis ${rating}/5`, rating <= 2 ? "danger" : "info", "/");
          });
          if (make && o) {
            const r = get().createTicket({ clientId: o.clientId, orderId, productId: o.lines[0].productId, type: "Livraison", source: "Avis ≤ 2/5", description: `Avis ${rating}/5 : « ${comment} »`, summary: `Le client a noté sa livraison ${rating}/5 : « ${comment} ».` }, "Équipe SAV");
            if (r.ok && r.id) mut((d) => { d.reviews[0].ticketId = r.id; });
          }
        },
        advanceDays: (k) => mut((d) => {
          const before = nowMs(d); d.dayOffset += k;
          d.products.forEach((p) => {
            if (p.promo && dayKey(before) <= p.promo.end && dayKey(nowMs(d)) > p.promo.end) {
              d.priceHistory.unshift({ id: id("h"), productId: p.id, old: p.promo.price, new: p.price, origin: "Fin de promo", author: "Système", at: iso(nowMs(d)) });
              log(d, "Système", "Prix", `Fin de promo : ${p.name} repasse à ${fmt(p.price)} DH.`);
            }
          });
        }),


      };
    },
    { name: "belle-image-db", version: 1, storage: createJSONStorage(() => localStorage), partialize: (s) => ({ db: s.db, session: s.session }), skipHydration: true },
  ),
);

export function assertConsistency(db: DB) {
  const issues: string[] = [];
  db.products.forEach((p) => { if (p.stock < 0) issues.push(`Stock négatif : ${p.ref}`); });
  db.orders.filter((o) => o.status === "Livrée & encaissée").forEach((o) => {
    if (!db.payments.some((p) => p.orderId === o.id && p.status !== "À encaisser")) issues.push(`${o.num} livrée sans encaissement`);
  });
  if (issues.length) console.warn("[assertConsistency]", issues);
  return issues;
}
