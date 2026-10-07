export type Agent = "Agent Catalogue" | "Agent SAV" | "Agent Admin Prix";
export type Sub =
  | "Réfrigérateurs" | "Lave-linge" | "Cuisson" | "TV & image" | "Climatisation" | "Petit électroménager"
  | "Salons" | "Chambres" | "Salles à manger" | "Rangement";
export type Category = "Électroménager" | "Ameublement";

export interface Product {
  id: string; ref: string; name: string; nameAr: string; brand: string; category: Category; sub: Sub;
  price: number; promo?: { price: number; start: string; end: string };
  stock: number; threshold: number; location: "Magasin" | "Dépôt";
  status: "Actif" | "Brouillon" | "Archivé"; agentVisible: boolean; warrantyMonths: number;
  description: string; imageUrl?: string; purchasePrice?: number; deliveryDays: number;
}
export interface Client { id: string; name: string; phone: string; city: string; quartier: string; address: string; landmark?: string; lang: "FR" | "AR" }
export interface OrderLine { productId: string; name: string; qty: number; unitPrice: number }
export type OrderStatus = "Nouvelle" | "Confirmée" | "En préparation" | "Prête" | "En livraison" | "Livrée & encaissée" | "Annulée" | "Retournée";
export interface Order {
  id: string; num: string; clientId: string; lines: OrderLine[]; fee: number; status: OrderStatus;
  source: "Magasin" | "WhatsApp Agent Catalogue" | "Téléphone"; mode: "Livraison à domicile" | "Retrait en magasin";
  createdAt: string; missing: string[]; notes: string; owner: string; transcriptId?: string;
  history: { at: string; text: string; actor: string }[]; cancelReason?: string; deliveredAt?: string;
}
export type DeliveryStatus = "À planifier" | "Planifiée" | "En route" | "Livrée" | "Échec" | "Reportée";
export type Slot = "Matin" | "Après-midi" | "Soir";
export interface Delivery { id: string; num: string; orderId: string; date: string; slot: Slot; driverId: string; status: DeliveryStatus; failReason?: string; loaded: string[] }
export type PayStatus = "À encaisser" | "Encaissé" | "Écart" | "Reversé";
export interface Payment { id: string; num: string; orderId: string; driverId: string; expected: number; received?: number; mode?: "Espèces" | "Chèque" | "Carte bancaire (TPE)"; status: PayStatus; at?: string; gapReason?: string; remitted?: boolean }
export interface Driver { id: string; name: string; phone: string; vehicle: string; status: "Disponible" | "En tournée" | "Absent" }
export interface Zone { id: string; name: string; fee: number | null; freeFrom?: number; cities: string[] }
export type TicketStatus = "Nouvelle" | "En analyse" | "Technicien assigné" | "Intervention planifiée" | "Résolue" | "Clôturée" | "Refusée — hors garantie";
export interface Msg { from: "client" | "agent" | "human" | "admin"; text: string; at: string; image?: boolean; buttons?: string[] }
export interface Ticket {
  id: string; num: string; clientId: string; orderId?: string; productId: string; type: string; status: TicketStatus;
  priority: "Basse" | "Normale" | "Haute"; createdAt: string; source: string; summary: string; description: string;
  technician?: string; interventionDate?: string; solution?: string; humanInCharge: boolean; messages: Msg[]; photos: number;
  notes: string; owner: string; refuseReason?: string;
}
export interface PriceChange { id: string; productId: string; old: number; new: number; origin: "Import Excel" | "WhatsApp Admin" | "Manuel" | "Fin de promo" | "Annulation"; author: string; at: string; batchId?: string; transcriptId?: string; undone?: boolean }
export interface StockMove { id: string; productId: string; type: "Entrée fournisseur" | "Sortie livraison" | "Retour client" | "Ajustement" | "Inventaire"; qty: number; before: number; after: number; reason: string; at: string; author: string }
export interface Activity { id: string; at: string; actor: string; kind: "Commandes" | "Stock" | "Prix" | "Livraisons" | "SAV" | "Agents" | "Import"; text: string }
export interface Notif { id: string; at: string; text: string; read: boolean; level: "info" | "warn" | "danger" | "success"; link?: string }
export interface Transcript { id: string; title: string; clientName: string; phone: string; messages: Msg[] }
export interface ImportBatch { id: string; file: string; at: string; author: string; applied: number; ignored: number; errors: number; changes: { productId: string; old: number; new: number }[]; undone: boolean }
export interface Review { id: string; clientId: string; orderId: string; rating: number; comment: string; at: string; ticketId?: string }
export interface Faq { id: string; cat: string; q: string; a: string; qAr?: string; active: boolean }
export interface Doc { id: string; name: string; size: number; at: string; indexed: boolean }
export interface Template { id: string; name: string; text: string }
