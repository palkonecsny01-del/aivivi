import { Check } from 'lucide-react';

export function PricingPage() {
  return (
    <div className="flex-1 bg-zinc-950 text-zinc-100 p-8 overflow-y-auto flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full text-center space-y-4 mb-12">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Emeld új szintre a munkát <span className="text-violet-400">AI Viviennel</span>
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm">
          Válassz csomagot a nagyobb tokenkeretért és a professzionális, korlátok nélküli funkciókért.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
        {/* Pro Plan */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-sm">
          <div>
            <h3 className="text-lg font-bold text-zinc-200">Pro Csomag</h3>
            <p className="text-xs text-zinc-500 mt-1">Személyes hatékonyság növelésére</p>
            <p className="text-3xl font-black mt-4">4.990 Ft<span className="text-xs font-normal text-zinc-500"> / hó</span></p>
            <ul className="mt-6 space-y-3 text-xs text-zinc-400">
              <li className="flex items-center gap-2"><Check size={14} className="text-violet-400" /> 2.000.000 havi token</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-violet-400" /> Gyorsabb válaszidő</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-violet-400" /> Hozzáférés az összes kiemelt sablonhoz</li>
            </ul>
          </div>
          <button className="w-full mt-8 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition-colors shadow-lg shadow-violet-600/25">
            Előfizetés
          </button>
        </div>

        {/* Business Plan */}
        <div className="bg-zinc-900/40 border-2 border-violet-500 rounded-2xl p-6 flex flex-col justify-between relative backdrop-blur-sm">
          <span className="absolute -top-3 right-4 bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Népszerű</span>
          <div>
            <h3 className="text-lg font-bold text-zinc-200">Business Csomag</h3>
            <p className="text-xs text-zinc-500 mt-1">Csapatoknak és professzionális vállalkozásoknak</p>
            <p className="text-3xl font-black mt-4">9.990 Ft<span className="text-xs font-normal text-zinc-500"> / hó</span></p>
            <ul className="mt-6 space-y-3 text-xs text-zinc-400">
              <li className="flex items-center gap-2"><Check size={14} className="text-violet-400" /> 10.000.000 havi token</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-violet-400" /> Prioritásos, legújabb AI modellek</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-violet-400" /> Dedikált, kiemelt ügyfélszolgálat</li>
            </ul>
          </div>
          <button className="w-full mt-8 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition-colors">
            Kapcsolatfelvétel
          </button>
        </div>
      </div>
    </div>
  );
}