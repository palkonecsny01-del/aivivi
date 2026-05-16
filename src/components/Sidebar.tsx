import { useState, useRef, useEffect } from 'react';
import {
  Bot, MessageSquare, Settings, Plus, Trash2, ChevronLeft, ChevronRight,
  Search, BookOpen, MoreHorizontal, PenLine, ChevronDown,
  Briefcase, BarChart2, TrendingUp, Search as SearchIcon, Megaphone, PieChart
} from 'lucide-react';
import { useI18n } from '../i18n';
import type { Database } from '../lib/database.types';

type Thread = Database['public']['Tables']['threads']['Row'];

// ── Conversation templates ────────────────────────────────────────────────────

export interface ConversationTemplate {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
  color: string;
}

export const TEMPLATES: ConversationTemplate[] = [
  {
    id: 'business-plan',
    icon: <Briefcase size={14} />,
    title: 'Üzleti terv',
    description: 'Teljes körű üzleti terv készítése',
    color: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
    prompt: `Segíts egy részletes üzleti tervet elkészíteni! Az üzleti tervnek a következőket kell tartalmaznia:

📋 **Struktúra:**
1. Üzleti összefoglaló (Executive Summary)
2. Vállalkozás bemutatása és misszió
3. Termék/Szolgáltatás részletes leírása
4. Piacelemzés (TAM, SAM, SOM)
5. Versenytárs-elemzés
6. Marketing és értékesítési stratégia
7. Operatív terv
8. Pénzügyi terv (3 évre: bevételi előrejelzés, break-even, cash-flow)
9. Kockázatelemzés (SWOT)
10. Megvalósítási ütemterv

Kérlek, kezdd azzal, hogy felteszed a legfontosabb kérdéseket: mi a vállalkozás ötlete, milyen iparágban működünk, ki a célközönség, és mekkora tőkével tervezünk indulni?`,
  },
  {
    id: 'marketing-plan',
    icon: <Megaphone size={14} />,
    title: 'Marketing terv',
    description: 'Pszichológia-alapú, profi marketing stratégia',
    color: 'text-pink-400 bg-pink-400/10 border-pink-500/20',
    prompt: `Dolgozz ki egy professzionális, pszichológia-alapú marketing tervet! A tervnek a legmodernebb marketingpszichológiai elveket kell alkalmaznia.

🧠 **Pszichológiai alapok, amiket használj:**
- Social Proof (társadalmi bizonyíték)
- Scarcity & Urgency (szűkösség és sürgősség)
- FOMO (Fear of Missing Out)
- Anchoring (horgonyozás)
- Loss Aversion (veszteségkerülés)
- Reciprocity (viszonosság)
- Authority (tekintély)

📱 **Social Media stratégia (platform-specifikus):**
- Instagram: Reels, Stories, Carousel, UGC
- TikTok: Virális formulák, trending hangok, hook-ok
- Facebook: Community building, retargeting, lookalike audiences
- LinkedIn: B2B pozicionálás, thought leadership

✍️ **Copywriting keretrendszerek:**
- AIDA (Attention, Interest, Desire, Action)
- PAS (Problem, Agitate, Solution)
- StoryBrand (7 lépéses narratíva)
- 4U formula (Urgent, Unique, Ultra-specific, Useful)

📊 **Tartalmazza:**
- Buyer persona mély-analízis (pszichográfia, fájdalompontok, motivációk)
- Content calendar (30 napos terv)
- Konverziós tölcsér (TOFU, MOFU, BOFU)
- KPI-ok és mérési módszerek
- Influencer marketing stratégia
- Email marketing szekvencia
- Hirdetési stratégia (Meta Ads, Google Ads)

Kezdd azzal, hogy részletesen feltárod a márkát, a terméket/szolgáltatást és a célközönséget!`,
  },
  {
    id: 'market-research',
    icon: <SearchIcon size={14} />,
    title: 'Piackutatás',
    description: 'Mélyreható piac- és fogyasztóelemzés',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
    prompt: `Végezz egy átfogó piackutatást! A kutatásnak valódi üzleti döntéseket kell támogatnia.

🔍 **Kutatási területek:**

1. **Piacméret és szegmensek**
   - TAM / SAM / SOM kalkuláció
   - Növekedési trendek és CAGR
   - Szegmentációs lehetőségek

2. **Fogyasztói analízis**
   - Demográfiai és pszichográfiai profil
   - Vásárlási döntési folyamat
   - Fájdalompontok és nem teljesített igények
   - Willingness-to-pay kutatás

3. **Versenykörnyezet**
   - Direkt és indirekt versenytársak
   - Piaci részesedés becslés
   - Versenyelőnyök és differenciáció

4. **Trendek és jövőkép**
   - Technológiai változások hatása
   - Szabályozói környezet
   - Fogyasztói magatartás változásai

5. **Belépési lehetőségek**
   - Piaci rések azonosítása
   - Potenciális partneri lehetőségek

Kérdezz rá az iparágra, a vállalkozás céljára és a kutatás fókuszára!`,
  },
  {
    id: 'competitor-analysis',
    icon: <BarChart2 size={14} />,
    title: 'Versenytárs elemzés',
    description: 'SWOT + kompetitív intelligencia',
    color: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
    prompt: `Végezz egy részletes versenytárs-elemzést! A cél a piaci pozicionálás és a versenyelőnyök azonosítása.

⚔️ **Elemzési keretrendszer:**

1. **Versenytársak azonosítása**
   - Direkt versenytársak (ugyanaz a termék/piac)
   - Indirekt versenytársak (helyettesítő termékek)
   - Potenciális jövőbeli belépők

2. **Minden versenytársnál elemezd:**
   - Termék/szolgáltatás portfólió és árazás
   - Értékajánlat és pozicionálás
   - Marketing és kommunikáció (hangnem, csatornák, üzenetek)
   - Online jelenlét (website, social media, SEO)
   - Ügyfélbázis és célcsoport
   - Erősségek és gyengeségek
   - Vásárlói vélemények elemzése

3. **SWOT mátrix (saját vállalkozás)**
   - Strengths: belső erősségek
   - Weaknesses: belső gyengeségek
   - Opportunities: külső lehetőségek
   - Threats: külső veszélyek

4. **Stratégiai következtetések**
   - Blue Ocean lehetőségek
   - Differenciációs pontok
   - Competitive Advantage sources

Mondd el az iparágat és a saját vállalkozásodat, hogy pontos elemzést adhassak!`,
  },
  {
    id: 'social-media-strategy',
    icon: <TrendingUp size={14} />,
    title: 'Social Media stratégia',
    description: 'Virális tartalom, engagement, growth',
    color: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
    prompt: `Készíts egy komplett, pszichológia-alapú Social Media stratégiát, ami valódi eredményeket hoz!

🚀 **A stratégia elemei:**

**1. Márkapozicionálás**
- Brand voice és személyiség definiálása
- Visual identity (szín, tipográfia, képstílus)
- Unique Value Proposition a social mediában

**2. Platform-specifikus megközelítés:**

📸 **Instagram**
- Reels stratégia (hook, content, CTA formula)
- Stories taktikák (polls, quizzes, countdown)
- Carousel posztok (edukáció + engagement)
- UGC (User Generated Content) ösztönzése

🎵 **TikTok**
- Virális hook formulák (első 3 másodperc)
- Trending hangok és effektek felhasználása
- Duet és Stitch lehetőségek
- TikTok SEO (kulcsszavak a szövegben)

👔 **LinkedIn (B2B)**
- Thought leadership tartalom
- Személyes márkaépítés
- Dokumentum posztok és karousellek

👥 **Facebook**
- Community (csoport) építés
- Facebook Ads remarketing
- Live videó stratégia

**3. Content pillars (3-5 tartalom-pillér)**
**4. 30 napos tartalomnaptár**
**5. Engagement taktikák** (komment stratégia, DM funnel)
**6. Influencer / Creator együttműködések**
**7. Fizetett hirdetés + organikus synergia**
**8. Mérőszámok és KPI-ok**

Kérdezz rá a márkára, a célközönségre és a jelenlegi social media helyzetre!`,
  },
  {
    id: 'financial-analysis',
    icon: <PieChart size={14} />,
    title: 'Pénzügyi elemzés',
    description: 'Cash-flow, P&L, befektetői előrejelzés',
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
    prompt: `Készíts egy átfogó pénzügyi elemzést és előrejelzést a vállalkozáshoz!

💰 **Elemzési területek:**

1. **Bevételi modell**
   - Bevételi streams azonosítása
   - Árazási stratégia (freemium, subscription, one-time, usage-based)
   - Átlagos tranzakciós érték (ATV) és Customer Lifetime Value (CLV)

2. **Költségstruktúra**
   - Fix vs. változó költségek
   - COGS (Cost of Goods Sold)
   - Operating Expenses (OPEX)
   - Customer Acquisition Cost (CAC)

3. **Pénzügyi kimutatások (3 éves előrejelzés)**
   - Profit & Loss (P&L) kimutatás
   - Cash-flow kimutatás
   - Break-even analízis
   - Unit Economics

4. **Tőkeszükséglet és befektetői anyag**
   - Runway kalkuláció
   - Seed/Series A célok
   - ROI és megtérülési kalkuláció
   - Valuáció módszerek

5. **Kockázati forgatókönyvek**
   - Best case / Base case / Worst case
   - Érzékenységvizsgálat

Kérdezz rá a jelenlegi bevételekre, költségekre és finanszírozási célokra!`,
  },
];

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onNewThreadWithTemplate: (template: ConversationTemplate) => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, title: string) => void;
  activePage: 'chat' | 'agents' | 'settings';
  onNavigate: (page: 'chat' | 'agents' | 'settings') => void;
  userName: string;
}

export function Sidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onNewThreadWithTemplate,
  onDeleteThread,
  onRenameThread,
  activePage,
  onNavigate,
  userName,
}: SidebarProps) {
  const [collapsed, setCollapsed]       = useState(false);
  const [search, setSearch]             = useState('');
  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameValue, setRenameValue]   = useState('');
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  // Close template menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
    };
    if (showTemplates) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTemplates]);

  const filteredThreads = threads.filter(th =>
    th.title.toLowerCase().includes(search.toLowerCase())
  );

  const groupThreads = () => {
    const now = new Date();
    const today: Thread[] = [], yesterday: Thread[] = [], older: Thread[] = [];
    filteredThreads.forEach(th => {
      const diff = (now.getTime() - new Date(th.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 1) today.push(th);
      else if (diff < 2) yesterday.push(th);
      else older.push(th);
    });
    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupThreads();

  const startRename = (thread: Thread) => {
    setRenamingId(thread.id);
    setRenameValue(thread.title);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) onRenameThread(renamingId, renameValue.trim());
    setRenamingId(null);
  };

  const ThreadItem = ({ thread }: { thread: Thread }) => (
    <div
      className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${
        activeThreadId === thread.id
          ? 'bg-zinc-700/60 text-zinc-100'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
      }`}
      onClick={() => onSelectThread(thread.id)}
      onMouseEnter={() => setHoveredThread(thread.id)}
      onMouseLeave={() => setHoveredThread(null)}
    >
      <MessageSquare size={14} className="shrink-0 opacity-60" />
      {renamingId === thread.id ? (
        <input
          className="flex-1 bg-transparent text-xs text-zinc-100 outline-none border-b border-blue-500"
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setRenamingId(null);
          }}
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-xs truncate">{thread.title}</span>
      )}
      {hoveredThread === thread.id && renamingId !== thread.id && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); startRename(thread); }}
            className="p-1 rounded hover:bg-zinc-600/50 text-zinc-500 hover:text-zinc-300"
          >
            <PenLine size={11} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDeleteThread(thread.id); }}
            className="p-1 rounded hover:bg-red-900/30 text-zinc-500 hover:text-red-400"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );

  const ThreadGroup = ({ label, items }: { label: string; items: Thread[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
        {items.map(th => <ThreadItem key={th.id} thread={th} />)}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className="w-12 flex flex-col items-center py-3 gap-3 border-r border-zinc-800 bg-zinc-900/50 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight size={15} />
        </button>
        <button
          onClick={onNewThread}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title={t.Layout.newChat}
        >
          <Plus size={15} />
        </button>
        <button
          onClick={() => onNavigate('chat')}
          className={`p-2 rounded-lg transition-colors ${activePage === 'chat' ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
        >
          <MessageSquare size={15} />
        </button>
        <button
          onClick={() => onNavigate('agents')}
          className={`p-2 rounded-lg transition-colors ${activePage === 'agents' ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
        >
          <Bot size={15} />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onNavigate('settings')}
          className={`p-2 rounded-lg transition-colors ${activePage === 'settings' ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
        >
          <Settings size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 flex flex-col border-r border-zinc-800 bg-zinc-900/50 shrink-0 overflow-hidden">
      {/* Brand header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="AI Vivien" className="w-6 h-6 rounded-md object-contain" />
          <span className="text-sm font-semibold text-zinc-100">AI Vivien</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* Navigation */}
      <div className="px-3 py-3 border-b border-zinc-800/60">
        <nav className="space-y-0.5">
          {([
            { id: 'chat' as const, icon: <MessageSquare size={15} />, label: t.Layout.chats },
            { id: 'agents' as const, icon: <Bot size={15} />, label: t.Layout.agents },
          ]).map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                activePage === item.id
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* New chat buttons */}
      <div className="px-3 py-3 space-y-1.5">
        {/* Plain new chat */}
        <button
          onClick={onNewThread}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          <Plus size={15} />
          {t.Layout.newChat}
        </button>

        {/* Template dropdown */}
        <div ref={templateRef} className="relative">
          <button
            onClick={() => setShowTemplates(v => !v)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 font-medium transition-colors border border-zinc-700/60"
          >
            <Briefcase size={13} />
            <span className="flex-1 text-left text-xs">Sablonok</span>
            <ChevronDown size={12} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>

          {showTemplates && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2 space-y-0.5">
                {TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setShowTemplates(false);
                      onNewThreadWithTemplate(tpl);
                    }}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left group"
                  >
                    <span className={`mt-0.5 p-1.5 rounded-md border ${tpl.color} shrink-0`}>
                      {tpl.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 group-hover:text-white">{tpl.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{tpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.Common.search}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-thin">
        {filteredThreads.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpen size={20} className="mx-auto mb-2 text-zinc-700" />
            <p className="text-xs text-zinc-600">
              {search ? t.Common.noResults : t.Layout.noConversationsYet}
            </p>
          </div>
        ) : (
          <>
            <ThreadGroup label={t.Layout.today} items={today} />
            <ThreadGroup label={t.Layout.yesterday} items={yesterday} />
            <ThreadGroup label={t.Layout.older} items={older} />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/60 px-3 py-3">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
            activePage === 'settings'
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-xs font-medium text-zinc-200 truncate">{userName}</p>
          </div>
          <MoreHorizontal size={14} className="text-zinc-500 shrink-0" />
        </button>
      </div>
    </div>
  );
}