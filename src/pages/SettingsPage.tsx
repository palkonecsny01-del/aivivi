import { useState, useEffect } from 'react';
import {
  User, Key, Palette, Bell, Shield, LogOut,
  Save, Eye, EyeOff, ChevronRight, Check, Globe, Lock, Trash2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useI18n, type Locale } from '../i18n';
import {
  saveAdminApiKey, deleteAdminApiKey, loadAdminApiKeys,
  saveAdminSystemPrompt, loadAdminSystemPrompt,
} from '../lib/apiKeysService';

interface SettingsPageProps {
  userEmail: string;
  userName: string;
  isAdmin?: boolean;
}

const API_KEY_PROVIDERS = [
  { id: 'google',    name: 'Google Gemini', desc: 'AIVivien modellek (ajánlott)', placeholder: 'AIza...' },
  { id: 'openai',    name: 'OpenAI',        desc: 'GPT-4o, GPT-4o Mini',          placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic',     desc: 'Claude 3.5 Sonnet, Haiku',     placeholder: 'sk-ant-...' },
  { id: 'xai',       name: 'xAI Grok',      desc: 'Grok modellek',                placeholder: 'xai-...' },
];

export function SettingsPage({ userEmail, userName, isAdmin = false }: SettingsPageProps) {
  const { signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [activeSection, setActiveSection] = useState<string>(isAdmin ? 'admin' : 'profile');
  const [displayName, setDisplayName]     = useState(userName);
  const [saved, setSaved]                 = useState(false);
  const [apiKeys, setApiKeys]             = useState<Record<string, string>>({});
  const [showKeys, setShowKeys]           = useState<Record<string, boolean>>({});
  const [savingKeys, setSavingKeys]       = useState(false);
  const [aiAvatarUrl, setAiAvatarUrl]     = useState<string>(
    () => localStorage.getItem('planlabstudio_ai_avatar_url') ?? ''
  );
  const [aiAvatarSaved, setAiAvatarSaved] = useState(false);
  const [systemPrompt, setSystemPrompt]   = useState('');
  const [systemPromptSaved, setSystemPromptSaved] = useState(false);
  const [loadingAdmin, setLoadingAdmin]   = useState(false);

  // Load admin keys and system prompt when admin section is opened
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingAdmin(true);
    Promise.all([
      loadAdminApiKeys(),
      loadAdminSystemPrompt(),
    ]).then(([keys, prompt]) => {
      setApiKeys(keys);
      setSystemPrompt(prompt);
    }).finally(() => setLoadingAdmin(false));
  }, [isAdmin]);

  const sections = [
    { id: 'profile',      icon: <User size={16} />,   label: t.Settings.profile },
    { id: 'appearance',   icon: <Palette size={16} />, label: t.Settings.appearance },
    { id: 'notifications',icon: <Bell size={16} />,   label: t.Settings.notifications },
    { id: 'security',     icon: <Shield size={16} />, label: t.Settings.security },
    ...(isAdmin ? [{ id: 'admin', icon: <Key size={16} />, label: '⚙️ Admin' }] : []),
  ];

  const flashSaved = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2200);
  };

  const handleSaveProfile = () => flashSaved(setSaved);

  const handleSaveAiAvatar = (url: string) => {
    localStorage.setItem('planlabstudio_ai_avatar_url', url);
    window.dispatchEvent(new Event('planlabstudio_avatar_changed'));
    flashSaved(setAiAvatarSaved);
  };

  const handleAiAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAiAvatarUrl(result);
      handleSaveAiAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAdminKeys = async () => {
    setSavingKeys(true);
    try {
      for (const [provider, key] of Object.entries(apiKeys)) {
        if (key && key.trim()) {
          await saveAdminApiKey(provider, key.trim());
        }
      }
      flashSaved(setSaved);
    } catch (e) {
      alert('Hiba az API kulcsok mentésekor: ' + (e as Error).message);
    } finally {
      setSavingKeys(false);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    if (!confirm(`Biztosan törlöd a(z) ${provider} API kulcsot?`)) return;
    await deleteAdminApiKey(provider);
    setApiKeys(p => { const copy = { ...p }; delete copy[provider]; return copy; });
  };

  const handleSaveSystemPrompt = async () => {
    try {
      await saveAdminSystemPrompt(systemPrompt);
      flashSaved(setSystemPromptSaved);
    } catch (e) {
      alert('Hiba a rendszerüzenet mentésekor: ' + (e as Error).message);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      // ── Profile ──────────────────────────────────────────────────────────
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-100 mb-1">{t.Settings.profile}</h2>
              <p className="text-sm text-zinc-500">{t.Settings.profileDescription}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{displayName}</p>
                <p className="text-xs text-zinc-500">{userEmail}</p>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-medium">
                    ⭐ Administrator
                  </span>
                )}
              </div>
            </div>
            <div className="h-px bg-zinc-800" />
            <div className="space-y-4 max-w-md">
              <Input label={t.Settings.displayName} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={userName} />
              <Input label={t.Settings.email} value={userEmail} disabled className="opacity-50" />
            </div>
            <Button onClick={handleSaveProfile} className="gap-2">
              {saved ? <><Check size={14} /> {t.Settings.saved}</> : <><Save size={14} /> {t.Settings.saveChanges}</>}
            </Button>
          </div>
        );

      // ── Appearance ────────────────────────────────────────────────────────
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-100 mb-1">{t.Settings.appearance}</h2>
              <p className="text-sm text-zinc-500">Testreszabhatja a megjelenést</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-300">{t.Layout.language}</p>
              <div className="flex gap-2">
                {([{ id: 'hu' as Locale, label: 'Magyar', flag: '🇭🇺' }, { id: 'en' as Locale, label: 'English', flag: '🇬🇧' }]).map(lang => (
                  <button key={lang.id} onClick={() => setLocale(lang.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border transition-all ${
                      locale === lang.id ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}>
                    <Globe size={14} />{lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-300">{t.Settings.theme}</p>
              <div className="grid grid-cols-3 gap-3">
                {[{ id: 'dark', label: t.Settings.dark, bg: 'bg-zinc-900' }, { id: 'light', label: t.Settings.light, bg: 'bg-zinc-100' }, { id: 'system', label: t.Settings.system, bg: 'bg-gradient-to-r from-zinc-900 to-zinc-100' }].map(theme => (
                  <button key={theme.id} className={`p-4 rounded-xl border-2 transition-all ${theme.id === 'dark' ? 'border-blue-500' : 'border-zinc-700 hover:border-zinc-600'}`}>
                    <div className={`h-12 rounded-lg ${theme.bg} mb-2`} />
                    <p className="text-xs text-zinc-400">{theme.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      // ── Notifications ─────────────────────────────────────────────────────
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-100 mb-1">{t.Settings.notifications}</h2>
              <p className="text-sm text-zinc-500">Értesítési beállítások</p>
            </div>
            {[
              { label: t.Settings.responseComplete, desc: t.Settings.responseCompleteDesc },
              { label: t.Settings.agentShared, desc: t.Settings.agentSharedDesc },
              { label: t.Settings.usageAlerts, desc: t.Settings.usageAlertsDesc },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <button className="w-10 h-6 bg-blue-600 rounded-full relative">
                  <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>
            ))}
          </div>
        );

      // ── Security ──────────────────────────────────────────────────────────
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-zinc-100 mb-1">{t.Settings.security}</h2>
              <p className="text-sm text-zinc-500">Fiókbiztonság kezelése</p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700/60 rounded-xl">
                <p className="text-sm font-medium text-zinc-200 mb-1">{t.Settings.password}</p>
                <p className="text-xs text-zinc-500 mb-3">{t.Settings.passwordDesc}</p>
                <Button variant="secondary" size="sm">{t.Settings.changePassword}</Button>
              </div>
              <div className="p-4 bg-red-900/10 border border-red-800/40 rounded-xl">
                <p className="text-sm font-medium text-red-400 mb-1">{t.Settings.dangerZone}</p>
                <p className="text-xs text-zinc-500 mb-3">{t.Settings.dangerZoneDesc}</p>
                <Button variant="danger" size="sm">{t.Settings.deleteAccount}</Button>
              </div>
            </div>
          </div>
        );

      // ── Admin ─────────────────────────────────────────────────────────────
      case 'admin':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-semibold text-zinc-100 mb-1">⚙️ Admin beállítások</h2>
              <p className="text-sm text-zinc-500">
                Ezek a beállítások minden felhasználóra érvényesek. Csak adminisztrátorok látják.
              </p>
            </div>

            {loadingAdmin && (
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
                Betöltés...
              </div>
            )}

            {/* ── API Keys (admin-only) ── */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                  <Key size={15} className="text-blue-400" /> API Kulcsok
                </h3>
                <p className="text-xs text-zinc-500">
                  Ezek a kulcsok minden felhasználó számára elérhetők. A Google Gemini kulcs az ajánlott, mert az AIVivien modellek erre épülnek.
                </p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-xs text-amber-400">
                  ⚠️ Az API kulcsok titkosítva tárolódnak az adatbázisban. Ne ossza meg senkivel!
                </p>
              </div>

              <div className="space-y-3">
                {API_KEY_PROVIDERS.map(provider => (
                  <div key={provider.id} className="p-4 bg-zinc-800/50 border border-zinc-700/60 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{provider.name}</p>
                        <p className="text-xs text-zinc-500">{provider.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {apiKeys[provider.id] && (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 rounded-full">
                            ✓ Aktív
                          </span>
                        )}
                        {apiKeys[provider.id] && (
                          <button
                            onClick={() => handleDeleteKey(provider.id)}
                            className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                            title="Törlés"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        value={apiKeys[provider.id] ?? ''}
                        onChange={e => setApiKeys(p => ({ ...p, [provider.id]: e.target.value }))}
                        placeholder={provider.placeholder}
                        className="w-full pr-10 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <button
                        onClick={() => setShowKeys(p => ({ ...p, [provider.id]: !p[provider.id] }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveAdminKeys} disabled={savingKeys} className="gap-2">
                {savingKeys
                  ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mentés...</>
                  : saved
                    ? <><Check size={14} /> Kulcsok mentve!</>
                    : <><Save size={14} /> API Kulcsok mentése</>}
              </Button>
            </div>

            <div className="h-px bg-zinc-800" />

            {/* ── System Prompt ── */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                  <Shield size={15} className="text-purple-400" /> AI Rendszerüzenet (System Prompt)
                </h3>
                <p className="text-xs text-zinc-500">
                  Ez az utasítás minden chat elején el lesz küldve az AI-nak. Meghatározhatja, mit tehet és mit nem tehet az AI,
                  milyen hangnemben kommunikáljon, stb.
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-xs text-blue-400">
                  💡 Példa: "Te AIVivien, egy professzionális üzleti tanácsadó asszisztens vagy. Csak üzleti, marketing és pénzügyi témákban segítesz. Politikai, jogi vagy orvosi tanácsot nem adsz. Mindig magyarul kommunikálj, udvariasan és szakszerűen."
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-400">Rendszerüzenet szövege</label>
                  <span className="text-[10px] text-zinc-600">{systemPrompt.length} karakter</span>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder="Pl.: Te AIVivien vagy, egy profi üzleti asszisztens. Segítesz üzleti tervek, marketing stratégiák és elemzések készítésében. Mindig magyarul kommunikálj, szakszerűen és barátságosan."
                  rows={8}
                  className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-y leading-relaxed"
                />
              </div>

              <Button onClick={handleSaveSystemPrompt} className="gap-2">
                {systemPromptSaved
                  ? <><Check size={14} /> Rendszerüzenet mentve!</>
                  : <><Save size={14} /> Rendszerüzenet mentése</>}
              </Button>
            </div>

            <div className="h-px bg-zinc-800" />

            {/* ── AI Avatar ── */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                  <User size={15} className="text-emerald-400" /> AI Avatar (Vivien)
                </h3>
                <p className="text-xs text-zinc-500">
                  Ez az avatar jelenik meg az AI üzenetek mellett.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center">
                  {aiAvatarUrl
                    ? <img src={aiAvatarUrl} alt="AI avatar" className="w-full h-full object-cover" />
                    : <span className="text-zinc-400 text-xs text-center px-1">Nincs kép</span>
                  }
                </div>
                <div className="space-y-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-xs text-zinc-200 transition-colors border border-zinc-600">
                    📁 Kép feltöltése
                    <input type="file" accept="image/*" className="hidden" onChange={handleAiAvatarFileUpload} />
                  </label>
                  {aiAvatarUrl && (
                    <button
                      onClick={() => { setAiAvatarUrl(''); handleSaveAiAvatar(''); }}
                      className="block text-xs text-red-400 hover:text-red-300"
                    >
                      Törlés
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  value={aiAvatarUrl.startsWith('data:') ? '' : aiAvatarUrl}
                  onChange={e => setAiAvatarUrl(e.target.value)}
                  placeholder="Vagy kép URL: https://..."
                  className="flex-1 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <Button onClick={() => handleSaveAiAvatar(aiAvatarUrl)} size="sm" className="gap-1.5 shrink-0">
                  {aiAvatarSaved ? <><Check size={13} /> Mentve</> : <><Save size={13} /> Mentés</>}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-56 border-r border-zinc-800 p-3 flex flex-col">
        <div className="mb-4 px-3 py-2">
          <h1 className="text-sm font-semibold text-zinc-100">{t.Settings.title}</h1>
        </div>
        <nav className="flex-1 space-y-0.5">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                activeSection === s.id
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {s.icon}
              {s.label}
              {activeSection === s.id && <ChevronRight size={12} className="ml-auto" />}
            </button>
          ))}
        </nav>

        {/* Non-admin: API keys locked notice */}
        {!isAdmin && (
          <div className="p-3 bg-zinc-800/50 border border-zinc-700/40 rounded-xl mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={12} className="text-zinc-500" />
              <span className="text-[11px] font-medium text-zinc-400">API Kulcsok</span>
            </div>
            <p className="text-[10px] text-zinc-600 leading-relaxed">
              Az API kulcsokat az adminisztrátor kezeli. Kérd meg az admint, ha szükséges.
            </p>
          </div>
        )}

        <div className="border-t border-zinc-800 pt-3">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={15} />
            {t.Settings.signOut}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}