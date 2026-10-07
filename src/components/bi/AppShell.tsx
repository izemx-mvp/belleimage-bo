import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingBag, Tags, Boxes, Truck, Wrench, BookOpen, Bell, Search, Plus, Menu, LogOut, RotateCcw, Sparkles, PanelLeftClose, Bot, Pause, Play, Wind,
} from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useStore, stockStatus, assertConsistency } from "@/lib/store";
import { dateTimeFr } from "@/lib/format";
import { Logo } from "./ui";
import { DrawersProvider } from "./drawers";
import { AmbientBackground } from "./backgrounds";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/commandes", label: "Commandes", icon: ShoppingBag, k: "orders" },
  { to: "/produits", label: "Produits & Prix", icon: Tags },
  { to: "/stock", label: "Stock", icon: Boxes, k: "stock" },
  { to: "/livraisons", label: "Livraisons", icon: Truck, k: "deliv" },
  { to: "/sav", label: "Réclamations SAV", icon: Wrench, k: "sav" },
  { to: "/base-de-connaissance", label: "Base de connaissance", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const db = useStore((s) => s.db);
  const pulse = useStore((s) => s.pulse);
  const { logout, reset, mut, readAllNotifs, runDemoStep } = useStore.getState();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [wave, setWave] = useState(0);

  const today = new Date().toISOString().slice(0, 10);
  const counts = useMemo(() => ({
    orders: db.orders.filter((o) => o.status === "Nouvelle").length,
    stock: db.products.filter((p) => p.status === "Actif" && stockStatus(db, p) !== "En stock").length,
    deliv: db.deliveries.filter((d) => d.date === today && d.status !== "Échec").length,
    sav: db.tickets.filter((t) => !["Clôturée", "Refusée — hors garantie", "Résolue"].includes(t.status)).length,
  }), [db, today]);
  const unread = db.notifications.filter((n) => !n.read).length;

  useEffect(() => { assertConsistency(db); }, [pulse]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd((v) => !v); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("reduce-motion", !!db.settings.reduceMotion); }, [db.settings.reduceMotion]);

  const crumbs = NAV.find((n) => n.to !== "/" && path.startsWith(n.to));
  const Side = (
    <aside className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all", collapsed ? "w-[76px]" : "w-64")}>
      <div className="relative flex min-h-40 items-center justify-between px-4 py-3">
        {!collapsed && <Logo light />}
        <button onClick={() => setCollapsed(!collapsed)} className="hidden rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent md:block" aria-label="Réduire"><PanelLeftClose className={cn("h-4 w-4", collapsed && "rotate-180")} /></button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          const c = "k" in n ? counts[n.k] : 0;
          return (
            <Link key={n.to} to={n.to} onClick={() => setMobile(false)} className={cn("relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
              {active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-sidebar-primary" />}
              <n.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-sidebar-primary")} />
              {!collapsed && <span className="flex-1">{n.label}</span>}
              {!collapsed && c > 0 && <span className="rounded-full bg-sidebar-primary px-1.5 text-[11px] font-bold text-sidebar-primary-foreground tnum">{c}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-sidebar-accent/50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">SB</div>
            {!collapsed && <div className="min-w-0"><div className="truncate text-sm font-semibold">Salma Berrada</div><div className="text-xs text-sidebar-foreground/60">Administratrice</div></div>}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-64">
            <DropdownMenuItem onClick={() => toast.info("Profil : Salma Berrada · admin@belleimage.ma · Administratrice")}>Mon profil</DropdownMenuItem>
            <DropdownMenuCheckboxItem checked={db.settings.reduceMotion} onCheckedChange={(v) => mut((d) => { d.settings.reduceMotion = !!v; })}><Wind className="h-4 w-4" />Réduire les animations</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { reset(); toast.success("Données de démo réinitialisées"); }}><RotateCcw className="h-4 w-4" />Réinitialiser les données de démo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { logout(); nav({ to: "/login" }); }}><LogOut className="h-4 w-4" />Déconnexion</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );

  return (
    <DrawersProvider>
      <div className="flex min-h-screen">
        <div className="sticky top-0 hidden h-screen md:block">{Side}</div>
        {mobile && <div className="fixed inset-0 z-50 flex md:hidden"><div className="h-full">{Side}</div><div className="flex-1 bg-ink/40" onClick={() => setMobile(false)} /></div>}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <AmbientBackground />
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/75 px-4 backdrop-blur md:px-8">
            <button className="md:hidden" onClick={() => setMobile(true)} aria-label="Menu"><Menu className="h-5 w-5" /></button>
            <div className="hidden text-sm text-muted-foreground sm:block">
              <Link to="/" className="hover:text-foreground">Belle Image</Link>
              <span className="mx-2">/</span><span className="font-semibold text-foreground">{crumbs?.label ?? "Dashboard"}</span>
            </div>
            <div className="flex-1" />
            <button onClick={() => setCmd(true)} className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground lg:flex">
              <Search className="h-4 w-4" />Rechercher<kbd className="ml-4 rounded border px-1 text-[10px]">Ctrl K</kbd>
            </button>
            <Button size="sm" onClick={() => nav({ to: "/commandes", search: { nouveau: "1" } })}><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nouvelle commande</span></Button>
            <Popover onOpenChange={(o) => { if (!o && unread) readAllNotifs(); }}>
              <PopoverTrigger className="relative rounded-full p-2 hover:bg-accent" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-primary-foreground">{unread}</span>}
                {wave > 0 && <span key={wave} className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand/30 [animation-iteration-count:2]" />}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-0">
                <div className="flex items-center justify-between border-b p-3"><b className="font-display">Notifications</b><button className="text-xs font-semibold text-brand" onClick={readAllNotifs}>Tout marquer lu</button></div>
                <div className="max-h-96 overflow-auto">
                  {db.notifications.slice(0, 25).map((n) => (
                    <button key={n.id} onClick={() => n.link && nav({ to: n.link })} className={cn("flex w-full gap-2 border-b px-3 py-2.5 text-left text-sm hover:bg-accent/50", !n.read && "bg-accent/30")}>
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.level === "danger" ? "bg-brand" : n.level === "warn" ? "bg-warning" : n.level === "success" ? "bg-success" : "bg-info")} />
                      <span className="flex-1"><span className="block">{n.text}</span><span className="text-xs text-muted-foreground">{dateTimeFr(n.at)}</span></span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </header>
          <main key={path.split("/")[1]} className="relative z-10 flex-1 animate-fadeup px-4 py-6 md:px-8 md:py-8">{children}</main>
          <div className="pointer-events-none fixed bottom-3 right-3 z-40 rounded-full border bg-card/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-soft backdrop-blur">Données fictives — démonstration</div>
        </div>
      </div>
      <CommandDialog open={cmd} onOpenChange={setCmd}>
        <CommandInput placeholder="Produit, référence, commande, client, téléphone, ticket…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Commandes">{db.orders.slice(0, 60).map((o) => { const c = db.clients.find((x) => x.id === o.clientId)!; return <CommandItem key={o.id} value={`${o.num} ${c.name} ${c.phone}`} onSelect={() => { setCmd(false); nav({ to: "/commandes/$id", params: { id: o.id } }); }}>{o.num} — {c.name}</CommandItem>; })}</CommandGroup>
          <CommandGroup heading="Produits">{db.products.map((p) => <CommandItem key={p.id} value={`${p.ref} ${p.name}`} onSelect={() => { setCmd(false); nav({ to: "/produits", search: { onglet: "catalogue", produit: p.id } }); }}>{p.ref} — {p.name}</CommandItem>)}</CommandGroup>
          <CommandGroup heading="Réclamations">{db.tickets.map((t) => <CommandItem key={t.id} value={`${t.num} ${db.clients.find((c) => c.id === t.clientId)?.name}`} onSelect={() => { setCmd(false); nav({ to: "/sav/$id", params: { id: t.id } }); }}>{t.num} — {t.type}</CommandItem>)}</CommandGroup>
        </CommandList>
      </CommandDialog>
    </DrawersProvider>
  );
}

