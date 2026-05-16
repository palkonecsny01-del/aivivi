import { useState } from "react";
import { supabase } from "../lib/supabase";
import { VivienLogo } from "../components/VivienLogo";

// ─── Icon helpers (inline SVG, no extra deps) ────────────────────────────────
const IconFunnel = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconLoader = () => (
  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

// ─── Feature pills ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <IconFunnel />,
    title: "Pszichológia‑vezérelt értékesítési tölcsérek",
    desc: "Konverzióra optimalizált funnel‑tervek, személyre szabott üzenetstratégiák és A/B teszt javaslatok.",
  },
  {
    icon: <IconChart />,
    title: "Automatizált piackutatás és versenytárs‑elemzés",
    desc: "Gyors, adatvezérelt SWOT‑mátrixok és versenytárs‑profilok, amelyekre azonnal építhető stratégia.",
  },
  {
    icon: <IconShield />,
    title: "Pénzügyi modellezés és megtérülés‑számítás",
    desc: "Cash‑flow előrejelzések, ROI kalkulációk és döntéstámogató pénzügyi kimutatások.",
  },
];

const WHY_US = [
  { label: "Gyakorlati fókusz", detail: "Nem elméletek — megvalósítható, mérhető javaslatok." },
  { label: "Gyors eredmények", detail: "Automatizált elemzések és kész sablonok, azonnal." },
  { label: "Biztonság & diszkréció", detail: "Vállalati szintű adatkezelés és hozzáférés‑kontroll." },
];

// ─── Main component ───────────────────────────────────────────────────────────
export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Ellenőrizze e‑mail fiókját a megerősítő linkért.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white flex">
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[60%] flex-col justify-between p-14 relative overflow-hidden h-screen sticky top-0">

        {/* Background texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(120,80,255,0.13) 0%, transparent 70%), " +
              "radial-gradient(ellipse 60% 80% at 80% 80%, rgba(30,180,130,0.09) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px), " +
              "repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <VivienLogo />
        </div>

        {/* Hero copy */}
        <div className="flex-1 flex items-center z-10">
          <div className="space-y-10 w-full max-w-[680px] mx-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300 uppercase tracking-widest">
              Üzleti AI platform
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-[1.12] tracking-tight text-white">
              Az üzleti döntések<br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                intelligens motorja.
              </span>
            </h1>
            <p className="text-[15px] leading-relaxed text-white/55 max-w-[420px]">
              AI Vivien egy professzionális, pszichológia‑alapú marketingstratéga, pénzügyi elemző és üzleti asszisztens egyetlen, biztonságos felületen. Gyorsan, megbízhatóan és üzleti célokra optimalizálva segít növelni a bevételt, csökkenteni a kockázatot és skálázni a működést.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 hover:border-violet-500/25 hover:bg-white/[0.05] transition-all duration-200"
              >
                <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90 leading-snug">{f.title}</p>
                  <p className="mt-0.5 text-xs text-white/45 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Why us */}
          <div className="grid grid-cols-3 gap-3">
            {WHY_US.map((w) => (
              <div key={w.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <IconCheck />
                  </span>
                  <p className="text-xs font-semibold text-white/80">{w.label}</p>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed">{w.detail}</p>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Bottom CTA strip */}
        <div className="relative z-10">
          <p className="text-xs text-white/30 tracking-wide">
            AI Vivien © 2026 PlanLabStudio. Minden jog fenntartva.
          </p>
        </div>
      </div>

      {/* ── Right panel: auth form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px] space-y-7">

          {/* Mobile logo */}
          <div className="lg:hidden mb-2">
            <VivienLogo />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {mode === "login" ? "Üdvözöljük viszont!" : "Hozzon létre fiókot"}
            </h2>
            <p className="mt-1 text-sm text-white/45">
              {mode === "login"
                ? "Lépjen be és folytassa ott, ahol abbahagyta."
                : "Regisztráljon és kezdje el a növekedést."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 rounded-xl bg-white/[0.05] border border-white/[0.07] p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === m
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/40"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {m === "login" ? "Bejelentkezés" : "Regisztráció"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">E‑mail cím</label>
              <input
                type="email"
                required
                placeholder="nev@ceg.hu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Jelszó</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all duration-200 active:scale-[0.98]"
            >
              {loading && <IconLoader />}
              {loading
                ? "Feldolgozás..."
                : mode === "login"
                  ? "Bejelentkezés"
                  : "Fiók létrehozása"}
            </button>
          </form>

          <p className="text-center text-xs text-white/25 leading-relaxed">
            A platform használatával elfogadja az{" "}
            <a href="#" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
              Adatvédelmi irányelveket
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
