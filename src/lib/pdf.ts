import { jsPDF } from "jspdf";
import type { DB } from "./store";
import { orderTotal, subtotal } from "./store";

const money = (v: number) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(v).replace(/\u202f|\u00a0/g, " ") + " DH";

function header(doc: jsPDF, title: string) {
  doc.setFillColor(227, 6, 19); doc.rect(0, 0, 210, 6, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(27, 18, 20); doc.text("Belle Image", 15, 22);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(107, 90, 93);
  doc.text("Rue 9, Magasin 141, Khabazate — Kénitra · +212 5 37 36 40 33 · contact@belleimage.ma", 15, 28);
  doc.setFontSize(14); doc.setTextColor(209, 5, 17); doc.text(title, 195, 22, { align: "right" });
  doc.setDrawColor(241, 228, 221); doc.line(15, 33, 195, 33);
}

export function orderPdf(db: DB, orderId: string, kind: "bon" | "recu") {
  const o = db.orders.find((x) => x.id === orderId)!; const c = db.clients.find((x) => x.id === o.clientId)!;
  const dl = db.deliveries.find((x) => x.orderId === o.id); const pay = db.payments.find((x) => x.orderId === o.id);
  const doc = new jsPDF();
  header(doc, kind === "bon" ? "BON DE LIVRAISON" : "REÇU D'ENCAISSEMENT");
  doc.setFontSize(10); doc.setTextColor(27, 18, 20);
  doc.text(`Commande : ${o.num}`, 15, 42); if (dl) doc.text(`Livraison : ${dl.num} — ${dl.date.split("-").reverse().join("/")} (${dl.slot})`, 15, 48);
  doc.text(`Client : ${c.name}`, 120, 42); doc.text(`Tél : ${c.phone}`, 120, 48); doc.text(`${c.address}, ${c.quartier} — ${c.city}`, 120, 54);
  let y = 66; doc.setFont("helvetica", "bold"); doc.text("Désignation", 15, y); doc.text("Qté", 130, y); doc.text("PU TTC", 150, y); doc.text("Total", 195, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  o.lines.forEach((l) => { y += 8; doc.text(l.name.slice(0, 60), 15, y); doc.text(String(l.qty), 130, y); doc.text(money(l.unitPrice), 150, y); doc.text(money(l.qty * l.unitPrice), 195, y, { align: "right" }); });
  y += 10; doc.line(15, y, 195, y); y += 8;
  doc.text(`Sous-total : ${money(subtotal(o))}`, 195, y, { align: "right" }); y += 6; doc.text(`Frais de livraison : ${money(o.fee)}`, 195, y, { align: "right" }); y += 8;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(`Total TTC : ${money(orderTotal(o))}`, 195, y, { align: "right" });
  y += 12; doc.setFontSize(11); doc.setTextColor(209, 5, 17);
  if (kind === "bon") doc.text(`Montant à régler à la livraison : ${money(orderTotal(o))}`, 15, y);
  else doc.text(`Reçu : ${money(pay?.received ?? 0)} — ${pay?.mode ?? ""} — le ${pay?.at ? new Date(pay.at).toLocaleString("fr-FR") : ""}`, 15, y);
  doc.setTextColor(107, 90, 93); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text("Paiement à la livraison uniquement — aucun paiement en ligne. Garantie constructeur.", 15, y + 8);
  doc.setTextColor(27, 18, 20); doc.text("Signature client", 30, 260); doc.text("Signature livreur", 140, 260);
  doc.rect(15, 230, 80, 25); doc.rect(115, 230, 80, 25);
  doc.save(`${kind === "bon" ? "bon-livraison" : "recu"}-${o.num}.pdf`);
}

export function simplePdf(title: string, lines: string[], file: string) {
  const doc = new jsPDF(); header(doc, title); doc.setFontSize(10); doc.setTextColor(27, 18, 20);
  let y = 44; lines.forEach((l) => { if (y > 280) { doc.addPage(); y = 20; } doc.text(l, 15, y); y += 7; });
  doc.save(file);
}
