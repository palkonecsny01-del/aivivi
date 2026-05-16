import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await signUp(email, password);
        alert('Regisztráció sikeres! Kérlek igazold vissza az e-mail címedet.');
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Hiba történt a hitelesítés során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
      {/* Bal oldal: Értékajánlat + VALÓDI LOGO */}
      <div className="md:w-1/2 bg-zinc-900/30 border-r border-zinc-900 p-8 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="AI Vivien" className="w-8 h-8 object-contain" />
          <span className="text-base font-black text-zinc-100">AI <span className="text-blue-400">Vivien</span></span>
        </div>

        <div className="max-w-md space-y-4 my-auto py-12">
          <h1 className="text-3xl font-black tracking-tight text-zinc-100">
            A vállalkozásod <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">intelligens motorja.</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            AI Vivien egy professzionális, pszichológia-alapú marketingstratéga, pénzügyi elemző és üzleti asszisztens egyetlen felületen.
          </p>

          <div className="space-y-3 pt-4 text-xs text-zinc-400">
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-bold">✦</span>
              <span>Pszichológiai alapú értékesítési tölcsérek (Funnel) tervezése</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-bold">✦</span>
              <span>Automata piackutatás, versenytárs elemzés és SWOT mátrixok</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-400 font-bold">✦</span>
              <span>Pénzügyi kimutatások, cash-flow és megtérülés kalkulációk</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-600">© 2026 PlanLabStudio. Minden jog fenntartva.</p>
      </div>

      {/* Jobb oldal */}
      <div className="md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{isSignUp ? 'Fiók létrehozása' : 'Üdv újra itt'}</h2>
            <p className="text-xs text-zinc-400 mt-1">Jelentkezz be a privát munkaterületedre.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">E-mail cím</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500" placeholder="nev@domain.hu" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400">Jelszó</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500" placeholder="••••••••" />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 size={12} className="animate-spin" />}
              {isSignUp ? 'Regisztráció' : 'Bejelentkezés'}
            </button>
          </form>

          <div className="text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-blue-400 hover:underline">
              {isSignUp ? 'Már van fiókod? Jelentkezz be' : 'Még nincs fiókod? Regisztrálj egyet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}