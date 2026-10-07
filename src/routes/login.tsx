import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/bi/ui";
import { ShowroomScene } from "@/components/bi/backgrounds";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Connexion — Belle Image Back-office" }, { name: "description", content: "Connectez-vous au back-office Belle Image." },
    { property: "og:title", content: "Connexion — Belle Image" }, { property: "og:description", content: "Accès équipe Belle Image." },
  ] }),
  component: Login,
});

const STEPS = ["Commande", "Préparation", "Livraison", "Encaissement", "SAV"];

function Login() {
  const login = useStore((s) => s.login); const nav = useNavigate();
  const [email, setEmail] = useState("admin@belleimage.ma"); const [pass, setPass] = useState("demo123");
  const [show, setShow] = useState(false); const [err, setErr] = useState(""); const [forgot, setForgot] = useState(false); const [busy, setBusy] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); const r = login(email, pass);
    if (!r.ok) return setErr(r.error);
    setBusy(true); setTimeout(() => nav({ to: "/" }), 700);
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.3fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <ShowroomScene />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <Logo />
          <div className="max-w-xl">
            <h1 className="font-display text-5xl font-semibold leading-tight text-ink-foreground drop-shadow">Vos commandes, votre stock, vos livraisons — pilotés par l'IA.</h1>
            <p className="mt-4 text-lg text-ink-foreground/80">Un seul back-office pour vendre, livrer, encaisser et servir vos clients sur WhatsApp.</p>
            <div className="relative mt-8 flex justify-between">
              <div className="absolute left-2 right-2 top-2 h-px bg-ink-foreground/30" />
              <span className="absolute top-1 h-2.5 w-2.5 animate-travel rounded-full bg-brand shadow-[0_0_12px_var(--brand)]" />
              {STEPS.map((s) => <div key={s} className="relative flex flex-col items-center gap-2 text-xs font-semibold text-ink-foreground"><span className="h-4 w-4 rounded-full border-2 border-brand bg-ink" />{s}</div>)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background p-6">
        <form onSubmit={submit} className={`w-full max-w-sm space-y-5 rounded-2xl border bg-card p-8 shadow-lift transition-all duration-500 ${busy ? "scale-95 opacity-0" : ""}`}>
          <div className="lg:hidden"><Logo /></div>
          <div><h2 className="font-display text-3xl font-semibold">Connexion</h2><p className="mt-1 text-sm text-muted-foreground">Espace équipe Belle Image — Kénitra</p></div>
          <div className="space-y-2"><Label htmlFor="em">E-mail</Label><Input id="em" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} /></div>
          <div className="space-y-2">
            <Label htmlFor="pw">Mot de passe</Label>
            <div className="relative"><Input id="pw" type={show ? "text" : "password"} value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Afficher le mot de passe">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked />Se souvenir de moi</label>
            <button type="button" className="font-semibold text-brand" onClick={() => setForgot(true)}>Mot de passe oublié</button>
          </div>
          {err && <p className="rounded-lg bg-accent p-2 text-sm text-accent-foreground">{err}</p>}
          <Button type="submit" className="w-full" size="lg">Se connecter</Button>
          <p className="text-center text-xs text-muted-foreground">Démo : admin@belleimage.ma / demo123</p>
        </form>
      </div>
      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent>
          <DialogHeader><DialogTitle>Réinitialiser le mot de passe</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Un lien de réinitialisation sera envoyé à {email}.</p>
          <Button onClick={() => { setForgot(false); toast.success(`Lien envoyé à ${email} (simulation)`); }}>Envoyer le lien</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
