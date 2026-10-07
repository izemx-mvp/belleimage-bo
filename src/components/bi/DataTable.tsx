import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Download, Search, X } from "lucide-react";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Empty } from "./ui";
import { cn } from "@/lib/utils";

export interface Col<T> { key: string; label: string; render: (r: T) => ReactNode; sort?: (r: T) => number | string; exp?: (r: T) => string | number; className?: string }
export interface Filter<T> { key: string; label: string; options: string[]; get: (r: T) => string }

export function DataTable<T extends { id: string }>({ rows, cols, filters = [], search, onRow, actions, exportName, selectable, bulk, initialFilters = {} }: {
  rows: T[]; cols: Col<T>[]; filters?: Filter<T>[]; search?: (r: T) => string; onRow?: (r: T) => void; actions?: ReactNode;
  exportName?: string; selectable?: boolean; bulk?: (ids: string[], clear: () => void) => ReactNode; initialFilters?: Record<string, string>;
}) {
  const [q, setQ] = useState("");
  const [f, setF] = useState<Record<string, string>>(initialFilters);
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0); const [size, setSize] = useState(25);
  const [sel, setSel] = useState<string[]>([]);
  const data = useMemo(() => {
    let r = rows.filter((x) => (!q || (search?.(x) ?? "").toLowerCase().includes(q.toLowerCase())) && filters.every((fl) => !f[fl.key] || fl.get(x) === f[fl.key]));
    if (sort) { const c = cols.find((c) => c.key === sort.k); if (c?.sort) r = [...r].sort((a, b) => (c.sort!(a) > c.sort!(b) ? 1 : -1) * sort.dir); }
    return r;
  }, [rows, q, f, sort, cols, filters, search]);
  const pages = Math.max(1, Math.ceil(data.length / size)); const p = Math.min(page, pages - 1);
  const view = data.slice(p * size, p * size + size);
  const exp = () => {
    const ws = XLSX.utils.json_to_sheet(data.map((r) => Object.fromEntries(cols.filter((c) => c.exp).map((c) => [c.label, c.exp!(r)]))));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Export"); XLSX.writeFile(wb, `${exportName ?? "export"}.xlsx`);
  };
  const active = Object.entries(f).filter(([, v]) => v);
  return (
    <div className="rounded-2xl border bg-card shadow-soft">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        {search && (
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Rechercher…" className="pl-9" />
          </div>
        )}
        {filters.map((fl) => (
          <select key={fl.key} value={f[fl.key] ?? ""} onChange={(e) => { setF({ ...f, [fl.key]: e.target.value }); setPage(0); }} className="h-9 rounded-md border bg-card px-2 text-sm">
            <option value="">{fl.label}</option>
            {fl.options.map((o) => <option key={o} value={o}>{o} ({rows.filter((r) => fl.get(r) === o).length})</option>)}
          </select>
        ))}
        {exportName && <Button variant="outline" size="sm" onClick={exp}><Download className="h-4 w-4" />Excel</Button>}
        {actions}
      </div>
      {(active.length > 0 || sel.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2 text-xs">
          {active.map(([k, v]) => <button key={k} onClick={() => setF({ ...f, [k]: "" })} className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5">{v}<X className="h-3 w-3" /></button>)}
          {active.length > 0 && <button className="font-semibold text-brand" onClick={() => setF({})}>Réinitialiser</button>}
          {sel.length > 0 && bulk && <div className="ml-auto flex items-center gap-2"><span className="font-semibold">{sel.length} sélectionné(s)</span>{bulk(sel, () => setSel([]))}</div>}
        </div>
      )}
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--color-border)]">
            <tr>
              {selectable && <th className="w-8 px-3"><input type="checkbox" checked={view.length > 0 && view.every((r) => sel.includes(r.id))} onChange={(e) => setSel(e.target.checked ? view.map((r) => r.id) : [])} /></th>}
              {cols.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", c.className)}>
                  {c.sort ? <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort({ k: c.key, dir: sort?.k === c.key && sort.dir === 1 ? -1 : 1 })}>{c.label}<ArrowUpDown className="h-3 w-3" /></button> : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.id} onClick={() => onRow?.(r)} className={cn("border-t transition-colors", onRow && "cursor-pointer hover:bg-accent/50")}>
                {selectable && <td className="px-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={sel.includes(r.id)} onChange={(e) => setSel(e.target.checked ? [...sel, r.id] : sel.filter((x) => x !== r.id))} /></td>}
                {cols.map((c) => <td key={c.key} className={cn("px-3 py-2.5 align-middle tnum", c.className)}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {view.length === 0 && <div className="p-6"><Empty text="Aucun résultat pour ces critères." /></div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <span>{data.length ? `${p * size + 1}–${Math.min(data.length, p * size + size)} sur ${data.length}` : "0 résultat"}</span>
        <div className="flex items-center gap-2">
          <select value={size} onChange={(e) => { setSize(+e.target.value); setPage(0); }} className="h-8 rounded border bg-card px-1">{[10, 25, 50, 100].map((s) => <option key={s}>{s}</option>)}</select>
          <Button size="sm" variant="outline" disabled={p === 0} onClick={() => setPage(p - 1)}>Préc.</Button>
          <span>{p + 1}/{pages}</span>
          <Button size="sm" variant="outline" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Suiv.</Button>
        </div>
      </div>
    </div>
  );
}
