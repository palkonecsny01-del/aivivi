import { useState, FormEvent } from 'react';
import { Bot, Zap, Shield, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { t } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setSuccess(mode === 'signin' ? '' : 'Account created! You can now sign in.');
    }
    setLoading(false);
  };

  const features = [
    { icon: <Zap size={18} />, title: t.AuthPage.features.multiModel.title, desc: t.AuthPage.features.multiModel.desc },
    { icon: <Bot size={18} />, title: t.AuthPage.features.customAgents.title, desc: t.AuthPage.features.customAgents.desc },
    { icon: <Shield size={18} />, title: t.AuthPage.features.secureByDefault.title, desc: t.AuthPage.features.secureByDefault.desc },
    { icon: <Users size={18} />, title: t.AuthPage.features.teamCollaboration.title, desc: t.AuthPage.features.teamCollaboration.desc },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel with video background */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-zinc-900 border-r border-zinc-800 p-12 relative overflow-hidden">
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10"
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-100">{t.AuthPage.brandName}</span>
          </div>
          <h1 className="text-4xl font-bold text-zinc-100 leading-tight mb-4">
            {t.AuthPage.headline1}<br />
            <span className="text-blue-400">{t.AuthPage.headline2}</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            {t.AuthPage.subline}
          </p>
        </div>

        <div className="space-y-5">
          {features.map(item => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{item.title}</p>
                <p className="text-sm text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-600">&copy; 2026 PlanLabStudio. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-100">{t.AuthPage.brandName}</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-100 mb-1">
              {mode === 'signin' ? t.AuthPage.welcomeBack : t.AuthPage.createAccount}
            </h2>
            <p className="text-sm text-zinc-400">
              {mode === 'signin'
                ? t.AuthPage.signInToWorkspace
                : t.AuthPage.startAIJourney}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.AuthPage.email}
              type="email"
              placeholder={t.AuthPage.emailPlaceholder}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label={t.AuthPage.password}
              type="password"
              placeholder={t.AuthPage.passwordPlaceholder}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />

            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
                {success}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              {mode === 'signin' ? t.Auth.SignIn.signIn : t.Auth.SignUp.createAccount}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            {mode === 'signin' ? t.AuthPage.noAccount : t.AuthPage.haveAccount}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {mode === 'signin' ? t.AuthPage.signUp : t.AuthPage.signIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
