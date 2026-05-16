import { useTokens } from '../contexts/TokenContext';
import { useAuth } from '../contexts/AuthContext';

export function PricingPage() {
  const { plan } = useTokens();
  const { user } = useAuth();

  const handlePlanSelect = async (selectedPlan: string) => {
    if (!user) return;
    
    if (plan === 'admin' || localStorage.getItem('vivien_user_plan') === 'admin') {
      alert(`Admin teszt: Átváltás "${selectedPlan}" csomag funkcióira.`);
      localStorage.setItem('vivien_user_plan', selectedPlan);
      window.location.reload();
      return;
    }

    console.log(`Csomag kiválasztva: ${selectedPlan}`);
  };

  const tiers = [
    {
      id: 'free',
      name: 'Ingyenes',
      price: '0 Ft',
      description: 'Alapszintű asszisztencia mindennapi feladatokhoz.',
      features: [
        '10,000 napi token limit',
        'Alapvető üzleti sablonok',
        'AI Vivien - Gyors Asszisztens hozzáférés'
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '4 990 Ft',
      description: 'Haladó funkciók vállalkozóknak és marketingeseknek.',
      features: [
        '2,000,000 havi token keret',
        'Prioritásos AI válaszidő',
        'AI Vivien - Tervező Gép és Pro Kódoló elérés',
        'Mentett egyedi ügynökök (max 5)'
      ],
    },
    {
      id: 'business',
      name: 'Business',
      price: '8 990 Ft',
      description: 'Teljes körű üzleti, marketing és pénzügyi automatizáció.',
      features: [
        '10,000,000 havi token keret',
        'Legnagyobb prioritás és sebesség',
        'Az összes prémium AI Vivien szakértői modell váltása',
        'Korlátlan egyedi AI ügynök létrehozása',
        'Dedikált tudásbázis csatolása'
      ],
    }
  ];

  return (
    <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Válassz csomagot</h1>
          <p className="text-zinc-400 max-w-md mx-auto text-sm">Biztosítsd a megfelelő token-kapacitást a vállalkozásod növekedéséhez.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {tiers.map((tier) => (
            <div key={tier.id} className={`rounded-xl border bg-zinc-900/50 p-6 flex flex-col justify-between ${tier.id === 'pro' ? 'border-blue-500/50 shadow-lg shadow-blue-500/5' : 'border-zinc-800'}`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">{tier.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{tier.description}</p>
                </div>
                <div className="py-2">
                  <span className="text-3xl font-black text-zinc-100">{tier.price}</span>
                  <span className="text-xs text-zinc-500 ml-1">/ hónap</span>
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-300 border-t border-zinc-800/80 pt-4">
                  {tier.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 shrink-0 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handlePlanSelect(tier.id)}
                className={`w-full mt-6 py-2 rounded-lg text-xs font-semibold transition-all ${tier.id === 'pro' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}
              >
                {plan === tier.id ? 'Aktuális csomag' : 'Kiválasztás'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}