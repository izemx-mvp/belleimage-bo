import type {
  Product, Client, Order, Delivery, Payment, Driver, Zone, Ticket, PriceChange, StockMove, Activity, Notif,
  Transcript, ImportBatch, Review, Faq, Doc, Template, Sub, OrderStatus, Slot,
} from "./types";

const DAY = 86400000;
export const iso = (d: number) => new Date(d).toISOString();
export const dayKey = (d: number | string) => new Date(d).toISOString().slice(0, 10);

export const SUBS: { cat: "Électroménager" | "Ameublement"; sub: Sub; slug: string }[] = [
  { cat: "Électroménager", sub: "Réfrigérateurs", slug: "/boutique/refrigerateurs" },
  { cat: "Électroménager", sub: "Lave-linge", slug: "/boutique/lave-linge" },
  { cat: "Électroménager", sub: "Cuisson", slug: "/boutique/cuisson" },
  { cat: "Électroménager", sub: "TV & image", slug: "/boutique/tv-image" },
  { cat: "Électroménager", sub: "Climatisation", slug: "/boutique/climatisation" },
  { cat: "Électroménager", sub: "Petit électroménager", slug: "/boutique/petit-electromenager" },
  { cat: "Ameublement", sub: "Salons", slug: "/boutique/salons" },
  { cat: "Ameublement", sub: "Chambres", slug: "/boutique/chambres" },
  { cat: "Ameublement", sub: "Salles à manger", slug: "/boutique/salles-a-manger" },
  { cat: "Ameublement", sub: "Rangement", slug: "/boutique/rangement" },
];

export const BRANDS: { name: string; warranty: number }[] = [
  { name: "Samsung", warranty: 24 }, { name: "LG", warranty: 24 }, { name: "Beko", warranty: 24 }, { name: "Haier", warranty: 24 },
  { name: "Condor", warranty: 12 }, { name: "Hisense", warranty: 24 }, { name: "Bosch", warranty: 24 }, { name: "Arçelik", warranty: 24 },
];

// ref, name, brand, sub, price
const P: [string, string, string, Sub, number][] = [
  ["SAM-RT38-INOX", "Réfrigérateur Samsung RT38 Inox 380 L", "Samsung", "Réfrigérateurs", 5990],
  ["LG-GN-B422", "Réfrigérateur LG No Frost 420 L", "LG", "Réfrigérateurs", 6890],
  ["BEK-RDNE455", "Réfrigérateur Beko 455 L", "Beko", "Réfrigérateurs", 5290],
  ["HAI-HRF-520", "Réfrigérateur américain Haier 520 L", "Haier", "Réfrigérateurs", 11900],
  ["CON-CRF-T36", "Réfrigérateur Condor 360 L", "Condor", "Réfrigérateurs", 3990],
  ["HIS-RT-267", "Réfrigérateur Hisense 267 L", "Hisense", "Réfrigérateurs", 3290],
  ["BOS-KGN39", "Réfrigérateur combiné Bosch Serie 4", "Bosch", "Réfrigérateurs", 8490],
  ["BEK-WMB71643", "Machine à laver Beko 7 kg", "Beko", "Lave-linge", 3490],
  ["SAM-WW90T", "Machine à laver Samsung 9 kg EcoBubble", "Samsung", "Lave-linge", 5790],
  ["LG-F4V5", "Machine à laver LG 8 kg AI DD", "LG", "Lave-linge", 5290],
  ["BOS-WAN28", "Machine à laver Bosch Serie 4 8 kg", "Bosch", "Lave-linge", 5990],
  ["CON-WM-610", "Machine à laver Condor 6 kg", "Condor", "Lave-linge", 2690],
  ["ARC-WM-9", "Lave-linge Arçelik 9 kg", "Arçelik", "Lave-linge", 4690],
  ["BOS-HBF113", "Four encastrable Bosch 66 L", "Bosch", "Cuisson", 3790],
  ["BEK-FSE6", "Cuisinière Beko 4 feux 60 cm", "Beko", "Cuisson", 3190],
  ["ARC-CK90", "Cuisinière Arçelik 5 feux 90 cm", "Arçelik", "Cuisson", 5490],
  ["SAM-MS23", "Micro-ondes Samsung 23 L", "Samsung", "Cuisson", 1190],
  ["LG-MH6535", "Micro-ondes grill LG 25 L", "LG", "Cuisson", 1390],
  ["CON-PLQ-4", "Plaque de cuisson Condor 4 feux", "Condor", "Cuisson", 1490],
  ["LG-OLED55-C3", "TV LG OLED 55\" C3 4K", "LG", "TV & image", 6490],
  ["SAM-QE65Q70", "TV Samsung QLED 65\" Q70", "Samsung", "TV & image", 9990],
  ["HIS-50A6", "TV Hisense 50\" 4K Smart", "Hisense", "TV & image", 3490],
  ["SAM-UE43", "TV Samsung 43\" Crystal UHD", "Samsung", "TV & image", 3290],
  ["LG-SN5Y", "Barre de son LG SN5Y", "LG", "TV & image", 1990],
  ["CON-TV32", "TV Condor 32\" HD", "Condor", "TV & image", 1590],
  ["HIS-AS12", "Climatiseur split Hisense 12 000 BTU", "Hisense", "Climatisation", 4290],
  ["LG-DUAL18", "Climatiseur LG Dual Inverter 18 000 BTU", "LG", "Climatisation", 7490],
  ["SAM-WIND9", "Climatiseur Samsung WindFree 9 000 BTU", "Samsung", "Climatisation", 5690],
  ["HAI-FLX12", "Climatiseur Haier Flexis 12 000 BTU", "Haier", "Climatisation", 4990],
  ["CON-CL24", "Climatiseur Condor 24 000 BTU", "Condor", "Climatisation", 6990],
  ["BOS-MMB64", "Mixeur Bosch VitaPower", "Bosch", "Petit électroménager", 390],
  ["BOS-MUM5", "Robot pâtissier Bosch MUM5", "Bosch", "Petit électroménager", 2490],
  ["ARC-AF4", "Friteuse sans huile Arçelik 4 L", "Arçelik", "Petit électroménager", 990],
  ["SAM-VS15", "Aspirateur balai Samsung Jet", "Samsung", "Petit électroménager", 2990],
  ["BEK-SIM3", "Fer à repasser vapeur Beko", "Beko", "Petit électroménager", 290],
  ["HAI-KET17", "Bouilloire Haier 1,7 L", "Haier", "Petit électroménager", 249],
  ["CON-CAF12", "Cafetière Condor 12 tasses", "Condor", "Petit électroménager", 349],
  ["SAL-ANGLE-NOV", "Salon d'angle Nova 6 places", "Arçelik", "Salons", 9900],
  ["SAL-MAR-7P", "Salon marocain Fès 7 places", "Condor", "Salons", 12500],
  ["SAL-CAN3-VEL", "Canapé 3 places velours", "Haier", "Salons", 4900],
  ["SAL-FAUT-RLX", "Fauteuil relax Tanger", "Beko", "Salons", 2400],
  ["SAL-TBL-BAS", "Table basse marbre & chêne", "Condor", "Salons", 1600],
  ["SAL-MEUB-TV", "Meuble TV Rabat 180 cm", "Condor", "Salons", 2200],
  ["CHB-LIT160", "Lit 160 cm avec sommier", "Condor", "Chambres", 4500],
  ["CHB-ADULT-LUX", "Chambre adulte complète Luxe", "Arçelik", "Chambres", 15900],
  ["CHB-ENF-90", "Chambre enfant 90 cm", "Beko", "Chambres", 6900],
  ["CHB-MATELAS160", "Matelas orthopédique 160×200", "Haier", "Chambres", 3200],
  ["CHB-COMMODE", "Commode 6 tiroirs", "Condor", "Chambres", 1900],
  ["CHB-CHEVET", "Table de chevet (paire)", "Condor", "Chambres", 990],
  ["SAM-SALLE-6C", "Salle à manger 6 chaises", "Arçelik", "Salles à manger", 7800],
  ["SAM-SALLE-8C", "Salle à manger 8 chaises Prestige", "Arçelik", "Salles à manger", 11400],
  ["SAM-TABLE-EXT", "Table extensible chêne", "Condor", "Salles à manger", 3900],
  ["SAM-CHAISE-4", "Lot de 4 chaises velours", "Beko", "Salles à manger", 2400],
  ["SAM-BUFFET", "Buffet bas 3 portes", "Condor", "Salles à manger", 3600],
  ["RAN-ARM3P", "Armoire 3 portes miroir", "Condor", "Rangement", 4200],
  ["RAN-ARM2P", "Armoire 2 portes", "Condor", "Rangement", 2900],
  ["RAN-DRESS", "Dressing modulable 240 cm", "Arçelik", "Rangement", 6400],
  ["RAN-BIBLIO", "Bibliothèque 5 niveaux", "Beko", "Rangement", 1400],
  ["RAN-CHAUSS", "Meuble à chaussures", "Condor", "Rangement", 890],
  ["RAN-VITRINE", "Vitrine vaisselier", "Haier", "Rangement", 3100],
];

export const LOW_IDX = [4, 22, 34, 47, 58]; // stock bas
export const OUT_IDX = [15, 41]; // rupture

const CLIENTS: [string, string, string, string][] = [
  ["Karim Benali", "Kénitra", "Maamora", "Rue 12, Imm. 4"], ["Sara Amrani", "Kénitra", "Val Fleuri", "Av. Mohammed V, n°88"],
  ["Youssef Alaoui", "Kénitra", "Khabazate", "Rue 9, n°31"], ["Khadija El Idrissi", "Kénitra", "Mimosas", "Bd Hassan II, n°5"],
  ["Hicham Tazi", "Kénitra", "Saknia", "Lot. Saknia, n°120"], ["Fatima Zahra Bennani", "Kénitra", "Bir Rami", "Bir Rami Est, n°44"],
  ["Mohamed Chraibi", "Kénitra", "Oulad Oujih", "Bloc C, n°17"], ["Nadia Lahlou", "Rabat", "Agdal", "Rue Oued Fès, n°9"],
  ["Omar Ziani", "Salé", "Tabriquet", "Hay Salam, n°60"], ["Imane Berrada", "Kénitra", "Maamora", "Résidence Al Amal, B12"],
  ["Rachid Fassi", "Sidi Slimane", "Centre", "Av. Allal Ben Abdellah, n°3"], ["Laila Ouazzani", "Kénitra", "Val Fleuri", "Rue Ibn Sina, n°14"],
  ["Abdelilah Naciri", "Kénitra", "Khabazate", "Rue 3, n°7"], ["Meryem Kettani", "Kénitra", "Mimosas", "Rue des Lilas, n°22"],
  ["Said Benjelloun", "Rabat", "Hay Riad", "Av. Annakhil, n°101"], ["Hanane Sqalli", "Kénitra", "Saknia", "Saknia 2, n°56"],
  ["Anouar Mansouri", "Kénitra", "Bir Rami", "Bir Rami Ouest, n°8"], ["Zineb Alami", "Salé", "Bettana", "Rue 4, n°19"],
  ["Driss Hajji", "Sidi Kacem", "Centre", "Bd Zerktouni, n°11"], ["Salma Idrissi", "Kénitra", "Maamora", "Lot. Riad, n°73"],
  ["Mustapha Rami", "Kénitra", "Oulad Oujih", "Bloc F, n°2"], ["Asmae Tahiri", "Kénitra", "Val Fleuri", "Rue 21, n°40"],
  ["Badr Squali", "Kénitra", "Khabazate", "Rue 15, n°64"], ["Houda Belkadi", "Rabat", "Océan", "Rue de Tanger, n°6"],
  ["Ayoub Chafik", "Kénitra", "Mimosas", "Av. Al Massira, n°27"],
];
const AR: Record<string, string> = {
  "Karim Benali": "كريم بنعلي", "Sara Amrani": "سارة العمراني", "Youssef Alaoui": "يوسف العلوي",
};

export const DRIVERS: Driver[] = [
  { id: "d1", name: "Youssef", phone: "+212 6 61 23 45 01", vehicle: "Camionnette Renault Master", status: "En tournée" },
  { id: "d2", name: "Hamza", phone: "+212 6 62 34 56 02", vehicle: "Camionnette Peugeot Boxer", status: "En tournée" },
  { id: "d3", name: "Mehdi", phone: "+212 6 63 45 67 03", vehicle: "Camion Isuzu 3,5 t", status: "Disponible" },
  { id: "d4", name: "Anass", phone: "+212 6 64 56 78 04", vehicle: "Camionnette Fiat Ducato", status: "Disponible" },
];

export const ZONES: Zone[] = [
  { id: "z1", name: "Kénitra centre", fee: 50, freeFrom: 3000, cities: ["Kénitra:Khabazate", "Kénitra:Val Fleuri", "Kénitra:Mimosas", "Kénitra:Saknia"] },
  { id: "z2", name: "Kénitra périphérie", fee: 80, cities: ["Kénitra:Maamora", "Kénitra:Bir Rami", "Kénitra:Oulad Oujih"] },
  { id: "z3", name: "Salé / Rabat", fee: 150, cities: ["Salé", "Rabat"] },
  { id: "z4", name: "Sidi Slimane / Sidi Kacem", fee: 120, cities: ["Sidi Slimane", "Sidi Kacem"] },
  { id: "z5", name: "Hors zones", fee: null, cities: [] },
];

let seq = 0;
const uid = (p: string) => `${p}${++seq}`;

export function buildSeed(now = Date.now()) {
  seq = 0;
  const today = new Date(now); today.setHours(10, 0, 0, 0);
  const T = today.getTime();
  const at = (days: number, h = 10, m = 0) => { const d = new Date(T - days * DAY); d.setHours(h, m, 0, 0); return iso(d.getTime()); };
  const dateOnly = (days: number) => dayKey(T - days * DAY + 12 * 3600000 - 10 * 3600000);

  const products: Product[] = P.map(([ref, name, brand, sub, price], i) => {
    const cat = SUBS.find((s) => s.sub === sub)!.cat;
    const w = BRANDS.find((b) => b.name === brand)!.warranty;
    const stock = OUT_IDX.includes(i) ? 0 : LOW_IDX.includes(i) ? 2 : 6 + ((i * 7) % 14);
    return {
      id: `p${i + 1}`, ref, name, nameAr: AR_NAMES[sub], brand, category: cat, sub, price,
      stock, threshold: LOW_IDX.includes(i) ? 3 : 3, location: i % 3 === 0 ? "Dépôt" : "Magasin",
      status: i === 59 ? "Brouillon" : i === 57 ? "Archivé" : "Actif",
      warrantyMonths: cat === "Ameublement" ? 12 : w,
      description: `${name} — garantie constructeur, livraison à domicile, paiement à la livraison.`,
      purchasePrice: Math.round(price * 0.78), deliveryDays: cat === "Ameublement" ? 5 : 2,
    };
  });
  // promos: 6 (2 ending soon)
  const promo = (i: number, pct: number, s: number, e: number) => {
    products[i].promo = { price: Math.round((products[i].price * (1 - pct)) / 10) * 10, start: dateOnly(s), end: dateOnly(-e) };
  };
  promo(7, 0.1, 10, 2); promo(13, 0.12, 5, 20); promo(25, 0.08, 3, 3); promo(37, 0.15, 8, 25); promo(49, 0.1, 2, 15); promo(30, 0.2, 1, 10);

  const clients: Client[] = CLIENTS.map(([name, city, quartier, address], i) => ({
    id: `c${i + 1}`, name, city, quartier, address,
    phone: `+212 ${i % 3 === 0 ? 7 : 6} ${String(60 + i).padStart(2, "0")} ${String(10 + i * 3).slice(-2)} ${String(20 + i * 7).slice(-2)} ${String(30 + i * 11).slice(-2)}`,
    lang: i % 4 === 1 ? "AR" : "FR", landmark: i % 2 ? "Près de la mosquée" : undefined,
  }));
  void AR;

  const orders: Order[] = []; const deliveries: Delivery[] = []; const payments: Payment[] = [];
  const movements: StockMove[] = [];
  const normalIdx = products.map((_, i) => i).filter((i) => !LOW_IDX.includes(i) && !OUT_IDX.includes(i) && i < 57);
  // plan: [status, daysAgo, deliveryInfo]
  type Plan = { s: OrderStatus; d: number; del?: { day: number; slot: Slot; drv: string; st: Delivery["status"]; pay?: "Encaissé" | "Écart" | "Reversé" | "À encaisser" } };
  const plans: Plan[] = [];
  for (let i = 0; i < 4; i++) plans.push({ s: "Nouvelle", d: i === 0 ? 0 : i });
  const todayDel: Plan["del"][] = [
    { day: 0, slot: "Matin", drv: "d1", st: "En route" }, { day: 0, slot: "Matin", drv: "d2", st: "En route" },
    { day: 0, slot: "Après-midi", drv: "d1", st: "En route" }, { day: 0, slot: "Après-midi", drv: "d3", st: "Planifiée" },
    { day: 0, slot: "Soir", drv: "d2", st: "Planifiée" }, { day: 0, slot: "Soir", drv: "d4", st: "Planifiée" },
  ];
  todayDel.forEach((del, k) => plans.push({ s: del!.st === "En route" ? "En livraison" : "Prête", d: 2 + k % 3, del }));
  plans.push({ s: "Confirmée", d: 1 }, { s: "Confirmée", d: 2 }, { s: "En préparation", d: 2 }, { s: "En préparation", d: 3 });
  plans.push({ s: "Prête", d: 3, del: { day: -1, slot: "Matin", drv: "d1", st: "Échec" } });
  plans.push({ s: "Prête", d: 4, del: { day: -2, slot: "Soir", drv: "d3", st: "Échec" } });
  plans.push({ s: "Prête", d: 1 });
  const delivered = 18;
  for (let k = 0; k < delivered; k++) {
    const d = 4 + Math.floor((k * 26) / delivered);
    const pay = k < 3 ? "Encaissé" : k === 3 ? "Écart" : "Reversé";
    plans.push({ s: "Livrée & encaissée", d, del: { day: k < 3 ? -0.5 : -(d - 2), slot: (["Matin", "Après-midi", "Soir"] as Slot[])[k % 3], drv: DRIVERS[k % 4].id, st: "Livrée", pay } });
  }
  plans.push({ s: "Annulée", d: 9 }, { s: "Annulée", d: 17 }, { s: "Retournée", d: 14 }, { s: "Retournée", d: 22 });

  plans.forEach((pl, n) => {
    const c = clients[(n * 7) % clients.length];
    const nl = 1 + (n % 3 === 0 ? 1 : 0);
    const lines = Array.from({ length: nl }, (_, j) => {
      const p = products[normalIdx[(n * 5 + j * 11) % normalIdx.length]];
      return { productId: p.id, name: p.name, qty: 1, unitPrice: p.price };
    });
    const sub = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const fee = feeFor(c, sub, ZONES) ?? 0;
    const num = `CMD-2026-${String(104 + n).padStart(4, "0")}`;
    const fromWhatsApp = pl.s === "Nouvelle" && n === 0;
    const src = fromWhatsApp || n % 4 === 2 ? "WhatsApp" : n % 4 === 1 ? "Téléphone" : "Magasin";
    const created = at(pl.d, 10 + (n % 8), (n * 13) % 60);
    const o: Order = {
      id: `o${n + 1}`, num, clientId: c.id, lines, fee, status: pl.s, source: src,
      mode: n % 9 === 5 ? "Retrait en magasin" : "Livraison à domicile", createdAt: created,
      missing: fromWhatsApp ? ["adresse"] : [], notes: "", owner: src === "WhatsApp" ? "Équipe commerciale" : ["Salma", "Nabil", "Houda"][n % 3],
      history: [{ at: created, text: "Commande créée", actor: src === "WhatsApp" ? "Équipe commerciale" : "Nabil" }],
      cancelReason: pl.s === "Annulée" ? "Client a changé d'avis" : undefined,
      transcriptId: fromWhatsApp ? "t1" : undefined,
    };
    if (o.mode === "Retrait en magasin" && pl.del) o.mode = "Livraison à domicile";
    orders.push(o);
    if (pl.del) {
      const ddate = dateOnly(-pl.del.day > 0 ? pl.del.day : pl.del.day === 0 ? 0 : Math.abs(pl.del.day));
      const realDate = pl.del.day === 0 ? dateOnly(0) : pl.del.day === -0.5 ? dateOnly(0) : dateOnly(Math.abs(pl.del.day));
      void ddate;
      const dl: Delivery = { id: `l${n + 1}`, num: `LIV-2026-${String(60 + n).padStart(4, "0")}`, orderId: o.id, date: realDate, slot: pl.del.slot, driverId: pl.del.drv, status: pl.del.st, failReason: pl.del.st === "Échec" ? (n % 2 ? "Client absent" : "Adresse introuvable") : undefined, loaded: [] };
      deliveries.push(dl);
      const expected = sub + fee;
      const p: Payment = { id: `pay${n + 1}`, num: `ENC-${String(300 + n)}`, orderId: o.id, driverId: dl.driverId, expected, status: "À encaisser" };
      if (pl.del.pay) {
        p.status = pl.del.pay; p.mode = pl.del.pay === "Reversé" && n % 5 === 0 ? "Chèque" : n % 7 === 0 ? "Carte bancaire (TPE)" : "Espèces";
        if (pl.del.pay === "Encaissé") p.mode = "Espèces";
        p.received = pl.del.pay === "Écart" ? expected - 50 : expected; p.gapReason = pl.del.pay === "Écart" ? "Remise accordée par le vendeur (50 DH), validée par Salma" : undefined;
        p.at = pl.del.day === -0.5 ? at(1, 19) : at(Math.abs(pl.del.day), 15); o.deliveredAt = p.at;
        if (pl.del.pay === "Encaissé") p.at = at(1 + (n % 2), 17);
      }
      payments.push(p);
    }
  });

  // Stock already reflects deliveries; add some movements history
  products.slice(0, 20).forEach((p, i) => {
    movements.push({ id: uid("m"), productId: p.id, type: "Entrée fournisseur", qty: 6, before: p.stock - 6 < 0 ? 0 : p.stock - 6, after: p.stock, reason: "Réception BL-" + (2400 + i), at: at(20 - i % 15, 9), author: "Nabil" });
  });
  LOW_IDX.forEach((i) => movements.push({ id: uid("m"), productId: products[i].id, type: "Ajustement", qty: -1, before: 3, after: 2, reason: "Casse en dépôt", at: at(2, 11), author: "Salma" }));

  const transcripts: Transcript[] = [
    { id: "t1", title: "Demande de commande — Réfrigérateur", clientName: clients[0].name, phone: clients[0].phone, messages: [
      { from: "client", text: "Salam, chhal taman dyal frigo Samsung RT38 ?", at: at(0, 9, 12) },
      { from: "team", text: "Bonjour Karim 👋 Le réfrigérateur Samsung RT38 Inox 380 L est à 5 990,00 DH TTC, disponible en magasin. Livraison à domicile, paiement à la livraison uniquement.", at: at(0, 9, 12) },
      { from: "client", text: "Mezyan, bghit ncommandih. Livraison l Maamora ?", at: at(0, 9, 14) },
      { from: "team", text: "Avec plaisir. Maamora est en zone périphérie. J'ai préparé votre demande de commande, un conseiller Belle Image va la confirmer. Pouvez-vous m'indiquer votre adresse exacte ?", at: at(0, 9, 14), buttons: ["Envoyer ma position", "Parler à un conseiller"] },
    ] },
    { id: "t2", title: "Réclamation — porte rayée", clientName: clients[1].name, phone: clients[1].phone, messages: [
      { from: "client", text: "Bonjour, le réfrigérateur est arrivé avec la porte rayée.", at: at(1, 18, 2) },
      { from: "team", text: "Je suis désolé Sara. Pouvez-vous m'envoyer une photo de la rayure et votre numéro de commande ?", at: at(1, 18, 2) },
      { from: "client", text: "Voici la photo", at: at(1, 18, 5), image: true },
      { from: "team", text: "Merci. Produit livré récemment, il est sous garantie ✓. J'ai créé le ticket et un responsable SAV vous contactera sous 24 h.", at: at(1, 18, 6) },
    ] },
    { id: "t3", title: "Admin — modification de prix", clientName: "Salma Berrada (admin)", phone: "+212 6 61 00 00 01", messages: [
      { from: "admin", text: "Passe la TV LG 55 pouces à 5 990 DH", at: at(3, 11, 0) },
      { from: "team", text: "TV LG OLED 55\" C3 4K (LG-OLED55-C3) : 6 490,00 DH → 5 990,00 DH (−7,7 %). Confirmez-vous ? Répondez OUI dans les 5 minutes.", at: at(3, 11, 0), buttons: ["OUI", "NON"] },
      { from: "admin", text: "OUI", at: at(3, 11, 1) },
      { from: "team", text: "✓ Prix appliqué. Historique mis à jour, modification annulable depuis le back-office.", at: at(3, 11, 1) },
    ] },
  ];

  const tktTypes = ["Panne", "Produit abîmé", "Pièce manquante", "Installation", "Livraison", "Facturation"];
  const tStatuses: Ticket["status"][] = ["Nouvelle", "Nouvelle", "En analyse", "Technicien assigné", "Intervention planifiée", "En analyse", "Résolue",
    "Clôturée", "Clôturée", "Clôturée", "Clôturée", "Clôturée", "Clôturée", "Clôturée", "Refusée — hors garantie"];
  const deliveredOrders = orders.filter((o) => o.status === "Livrée & encaissée");
  const tickets: Ticket[] = tStatuses.map((st, i) => {
    const o = deliveredOrders[i % deliveredOrders.length];
    const p = products.find((x) => x.id === o.lines[0].productId)!;
    const created = at(i < 7 ? i + (i === 2 || i === 3 ? 5 : 0) : 10 + i, 14);
    return {
      id: `s${i + 1}`, num: `SAV-${String(i + 1).padStart(4, "0")}`, clientId: i === 0 ? clients[1].id : o.clientId, orderId: o.id, productId: p.id,
      type: tktTypes[i % tktTypes.length], status: st, priority: i % 3 === 0 ? "Haute" : "Normale", createdAt: created,
      source: i === 0 ? "WhatsApp" : i % 3 === 1 ? "Magasin" : i % 3 === 2 ? "Téléphone" : "WhatsApp",
      summary: i === 0 ? "Le client signale que le réfrigérateur est arrivé avec une porte rayée. Photo reçue. Sous garantie." : `Le client signale un problème de type « ${tktTypes[i % tktTypes.length].toLowerCase()} » sur ${p.name}.`,
      description: "Description fournie par le client via WhatsApp.", technician: ["Technicien assigné", "Intervention planifiée", "Résolue"].includes(st) || st === "Clôturée" ? "Rachid (technicien)" : undefined,
      interventionDate: st === "Intervention planifiée" ? dateOnly(-2) : undefined, solution: st === "Clôturée" || st === "Résolue" ? "Réparation" : undefined,
      humanInCharge: false, messages: i === 0 ? transcripts[1].messages : [
        { from: "client", text: `Bonjour, j'ai un souci avec ${p.name}.`, at: created },
        { from: "team", text: "Merci pour votre message. Pouvez-vous décrire le problème et envoyer une photo ?", at: created },
      ], photos: i % 2 === 0 ? 1 : 0, notes: "", owner: "Houda (SAV)", refuseReason: st.startsWith("Refusée") ? "Garantie expirée" : undefined,
    };
  });

  const priceHistory: PriceChange[] = [];
  const ph = (i: number, old: number, nw: number, origin: PriceChange["origin"], author: string, d: number, extra: Partial<PriceChange> = {}) =>
    priceHistory.push({ id: uid("h"), productId: products[i].id, old, new: nw, origin, author, at: at(d, 11), ...extra });
  ph(19, 6490, 5990, "WhatsApp Admin", "+212 6 61 00 00 01", 3, { transcriptId: "t3" });
  products[19].price = 5990;
  ph(0, 6290, 5990, "Import Excel", "Salma Berrada", 4, { batchId: "b1" });
  ph(1, 6590, 6890, "Import Excel", "Salma Berrada", 4, { batchId: "b1" });
  ph(8, 5990, 5790, "Import Excel", "Salma Berrada", 4, { batchId: "b1" });
  ph(20, 10490, 9990, "Manuel", "Nabil", 5);
  ph(26, 7290, 7490, "Manuel", "Salma Berrada", 2);
  ph(37, 10500, 9900, "WhatsApp Admin", "+212 6 61 00 00 01", 1);
  ph(43, 4700, 4500, "Manuel", "Nabil", 6);
  ph(49, 7900, 7800, "Import Excel", "Salma Berrada", 4, { batchId: "b1" });
  ph(13, 3890, 3790, "Manuel", "Salma Berrada", 12);
  ph(31, 2590, 2490, "Import Excel", "Salma Berrada", 18, { batchId: "b0" });
  ph(54, 4400, 4200, "Fin de promo", "Système", 20);

  const imports: ImportBatch[] = [
    { id: "b1", file: "prix-octobre.xlsx", at: at(4, 11), author: "Salma Berrada", applied: 4, ignored: 2, errors: 1,
      changes: [{ productId: "p1", old: 6290, new: 5990 }, { productId: "p2", old: 6590, new: 6890 }, { productId: "p9", old: 5990, new: 5790 }, { productId: "p50", old: 7900, new: 7800 }], undone: false },
    { id: "b0", file: "maj-petit-electro.xlsx", at: at(18, 11), author: "Salma Berrada", applied: 1, ignored: 0, errors: 0, changes: [{ productId: "p32", old: 2590, new: 2490 }], undone: false },
  ];

  const reviews: Review[] = deliveredOrders.slice(0, 8).map((o, i) => ({
    id: `r${i + 1}`, clientId: o.clientId, orderId: o.id, rating: [5, 4, 5, 4, 2, 5, 4, 5][i],
    comment: ["Livraison rapide, merci !", "Bon service", "Très professionnels", "Livreur aimable", "Retard de 2 heures, pas prévenu", "Parfait", "Bien", "Je recommande"][i], at: at(4 + i, 20),
  }));

  const activity: Activity[] = [
    { id: uid("a"), at: at(0, 9, 15), actor: "Équipe commerciale", kind: "Messages", text: `Équipe commerciale a créé la commande ${orders[0].num} (à confirmer).` },
    { id: uid("a"), at: at(1, 18, 6), actor: "Équipe SAV", kind: "SAV", text: "Réclamation SAV-0001 créée par l'Équipe SAV." },
    { id: uid("a"), at: at(1, 19), actor: "Youssef", kind: "Livraisons", text: "Livraison encaissée en espèces." },
    { id: uid("a"), at: at(2, 11), actor: "Salma", kind: "Stock", text: "Ajustement de stock : casse en dépôt." },
    { id: uid("a"), at: at(3, 11, 1), actor: "Administration", kind: "Prix", text: "Administration a modifié le prix de TV LG OLED 55\" C3 : 6 490 → 5 990 DH." },
    { id: uid("a"), at: at(4, 11), actor: "Salma", kind: "Import", text: "Import Excel « prix-octobre.xlsx » : 4 prix mis à jour." },
  ];
  const notifications: Notif[] = [
    { id: uid("n"), at: at(0, 9, 15), text: `Nouvelle commande ${orders[0].num} créée par l'Équipe commerciale — adresse manquante`, read: false, level: "info", link: `/commandes/${orders[0].id}` },
    { id: uid("n"), at: at(1, 18, 6), text: "SAV-0001 : réclamation produit abîmé (garantie ✓)", read: false, level: "warn", link: "/sav/s1" },
    { id: uid("n"), at: at(0, 8), text: "5 produits sous le seuil d'alerte", read: false, level: "warn", link: "/stock" },
  ];

  const faqs: Faq[] = [
    ["Paiement", "Puis-je payer en ligne ?", "Non, le paiement se fait uniquement à la livraison (espèces, chèque, carte via TPE du livreur)."],
    ["Livraison", "Livrez-vous à domicile ?", "Oui, nous livrons à Kénitra et ses environs, ainsi qu'à Salé, Rabat, Sidi Slimane et Sidi Kacem."],
    ["Livraison", "Quel est le délai de livraison ?", "En général 24 à 48 h pour l'électroménager en stock, 3 à 7 jours pour l'ameublement."],
    ["Livraison", "Combien coûte la livraison ?", "Kénitra centre : gratuite dès 3 000 DH, sinon 50 DH. Périphérie 80 DH, Salé/Rabat 150 DH, Sidi Slimane/Sidi Kacem 120 DH."],
    ["Garantie & SAV", "Comment faire une réclamation ?", "Écrivez-nous sur WhatsApp avec votre numéro de commande, une photo et une description du problème."],
    ["Garantie & SAV", "Que couvre la garantie ?", "La garantie constructeur couvre les pannes hors mauvaise utilisation, selon la durée de la marque (12 à 24 mois)."],
    ["Magasin", "Puis-je voir le produit avant d'acheter ?", "Bien sûr ! Venez voir, toucher, comparer au magasin, Rue 9, Magasin 141, Khabazate, Kénitra."],
    ["Magasin", "Quels sont vos horaires ?", "Ouvert 7j/7 de 09:00 à 22:00."],
    ["Commandes", "Comment passer commande ?", "Par WhatsApp, par téléphone au +212 5 37 36 40 33 ou directement au magasin."],
    ["Commandes", "Puis-je annuler ma commande ?", "Oui, avant la livraison, en contactant notre équipe."],
    ["Produits", "Proposez-vous l'installation ?", "Oui, installation des climatiseurs et montage des meubles sur demande."],
    ["Paiement", "Acceptez-vous les chèques ?", "Oui, chèque à l'ordre de Belle Image, remis au livreur."],
    ["Produits", "Les produits sont-ils neufs ?", "Tous nos produits sont neufs, sous emballage d'origine et garantis."],
    ["Garantie & SAV", "Le technicien se déplace-t-il ?", "Oui, une intervention à domicile est planifiée selon le diagnostic."],
    ["Livraison", "Montez-vous les meubles à l'étage ?", "Oui, livraison et montage à l'étage inclus pour l'ameublement."],
  ].map(([cat, q, a], i) => ({ id: `f${i + 1}`, cat, q, a, active: true }));

  const docs: Doc[] = [
    { id: "doc1", name: "Conditions de garantie.pdf", size: 182000, at: at(40), indexed: true },
    { id: "doc2", name: "Procédure SAV.pdf", size: 96000, at: at(35), indexed: true },
    { id: "doc3", name: "Conditions générales de vente.pdf", size: 240000, at: at(60), indexed: true },
    { id: "doc4", name: "Catalogue Ameublement 2026.pdf", size: 4800000, at: at(10), indexed: true },
    { id: "doc5", name: "Guide d'entretien électroménager.pdf", size: 1200000, at: at(2), indexed: false },
  ];
  const templates: Template[] = [
    { id: "tp1", name: "Confirmation de commande", text: "Bonjour {client}, votre commande {commande} est confirmée. Paiement à la livraison. Merci de votre confiance — Belle Image." },
    { id: "tp2", name: "En route", text: "Votre commande {commande} est en route avec {livreur}. Arrivée prévue {creneau}." },
    { id: "tp3", name: "Retard", text: "Bonjour {client}, votre livraison {commande} aura un peu de retard. Toutes nos excuses." },
    { id: "tp4", name: "Réclamation reçue", text: "Bonjour {client}, nous avons bien reçu votre réclamation {ticket}. Un responsable vous recontacte rapidement." },
    { id: "tp5", name: "Intervention planifiée", text: "Bonjour {client}, l'intervention du technicien est planifiée le {date}." },
    { id: "tp6", name: "Demande d'avis", text: "Comment s'est passée votre livraison ? Donnez une note de 1 à 5." },
  ];

  return {
    products, clients, orders, deliveries, payments, drivers: DRIVERS.map((d) => ({ ...d })), zones: ZONES.map((z) => ({ ...z })),
    tickets, priceHistory, movements, activity, notifications, transcripts, imports, reviews, faqs, docs, templates,
    brands: BRANDS.map((b) => ({ ...b, archived: false })), subs: SUBS.map((s) => ({ ...s })),
    settings: {
      hours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((d) => ({ day: d, open: "09:00", close: "22:00", closed: false })),
      exceptions: [{ date: "Aïd al-Adha", note: "Fermé le premier jour" }],
      address: "Rue 9, Magasin 141, Khabazate, Kénitra", phone: "+212 5 37 36 40 33", whatsapp: "+212 6 61 00 00 00", email: "contact@belleimage.ma",
      socials: [{ name: "Facebook", url: "https://www.facebook.com/Belleimagekenitra" }, { name: "Instagram", url: "https://www.instagram.com/belleimagekenitra" }, { name: "WhatsApp", url: "https://wa.me/212661000000" }],
      adminNumbers: ["+212 6 61 00 00 01"], varThreshold: 30, confirmMinutes: 5, capacity: 4,
      lowRatingTicket: true,
      demoEvents: false, reduceMotion: false,
    },
    demoStep: 0, dayOffset: 0, seededAt: iso(now),
  };
}

const AR_NAMES: Record<Sub, string> = {
  "Réfrigérateurs": "ثلاجة", "Lave-linge": "آلة غسيل", "Cuisson": "طهي", "TV & image": "تلفاز", "Climatisation": "مكيف",
  "Petit électroménager": "أجهزة صغيرة", "Salons": "صالون", "Chambres": "غرفة نوم", "Salles à manger": "غرفة طعام", "Rangement": "خزانة",
};

export function zoneFor(c: { city: string; quartier: string }, zones: Zone[]) {
  return zones.find((z) => z.cities.includes(`${c.city}:${c.quartier}`) || z.cities.includes(c.city)) ?? zones.find((z) => z.fee === null)!;
}
export function feeFor(c: { city: string; quartier: string }, subtotal: number, zones: Zone[]): number | null {
  const z = zoneFor(c, zones);
  if (z.fee === null) return null;
  if (z.freeFrom && subtotal >= z.freeFrom) return 0;
  return z.fee;
}
