import { describe, expect, it } from "vitest";
import { CLIENT_CATALOGUE } from "./catalogue";
import { buildSeed } from "./seed";
import { migrateCatalogue } from "./store";

describe("Client catalogue", () => {
  it("uses the public store catalogue without fictional seed price overrides", () => {
    const db = buildSeed();
    expect(db.products).toHaveLength(44);
    expect(db.products.find((p) => p.ref === "BI-1000")?.price).toBe(6499);
    expect(db.products.find((p) => p.ref === "BI-1015")?.price).toBe(5499);
    expect(db.products.every((p) => p.imageUrl?.startsWith("/__l5e/assets-v1/"))).toBe(true);
    expect(db.products.map((p) => p.price)).toEqual(CLIENT_CATALOGUE.map((p) => p.price));
  });
  it("keeps existing sessions and order totals when replacing legacy references", () => {
    const db = buildSeed();
    const first = db.products[0];
    first.ref = "SAM-RT38-INOX";
    first.name = "Ancien produit";
    const before = db.orders.map((o) => o.lines.map((l) => l.unitPrice));
    const migrated = migrateCatalogue({ db, session: { email: "demo@example.com" } });
    expect(migrated.session?.email).toBe("demo@example.com");
    expect(migrated.db.products[0].ref).toBe("BI-1000");
    expect(migrated.db.orders.map((o) => o.lines.map((l) => l.unitPrice))).toEqual(before);
    expect(migrated.db.orders.every((o) => o.lines.every((l) => migrated.db.products.some((p) => p.id === l.productId && p.name === l.name)))).toBe(true);
  });
});