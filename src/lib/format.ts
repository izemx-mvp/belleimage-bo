export const dh = (v: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v).replace(/\u202f|\u00a0/g, " ") + " DH";
export const dh0 = (v: number) => new Intl.NumberFormat("fr-FR").format(Math.round(v)).replace(/\u202f|\u00a0/g, " ") + " DH";
export const dateFr = (d: string | number) => new Date(d).toLocaleDateString("fr-FR");
export const dateTimeFr = (d: string | number) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const timeFr = (d: string | number) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
export const dayFr = (k: string) => k.split("-").reverse().join("/");
export const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
export const pct = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1).replace(".", ",")} %`;
