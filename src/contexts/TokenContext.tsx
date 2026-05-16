import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type PlanType = 'free' | 'starter' | 'pro';

export const PLAN_LIMITS: Record<PlanType, { daily: number | null; monthly: number | null }> = {
  free:    { daily: 100_000,   monthly: null },
  starter: { daily: null,      monthly: 5_000_000 },
  pro:     { daily: null,      monthly: 25_000_000 },
};

export const PLAN_LABELS: Record<PlanType, string> = {
  free:    'Ingyenes',
  starter: 'Starter',
  pro:     'Pro',
};

interface TokenState {
  used: number;
  plan: PlanType;
  loading: boolean;
}

interface TokenContextValue extends TokenState {
  addTokens: (amount: number) => Promise<void>;
  limit: number;
  remaining: number;
  percentUsed: number;
  isLimitReached: boolean;
  refresh: () => Promise<void>;
}

const TokenContext = createContext<TokenContextValue | null>(null);

export function TokenProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TokenState>({ used: 0, plan: 'free', loading: true });

  const getLimit = (plan: PlanType) => {
    const l = PLAN_LIMITS[plan];
    if (l.daily !== null) return l.daily;
    if (l.monthly !== null) return l.monthly;
    return Infinity;
  };

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState(s => ({ ...s, loading: false })); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single();

      const plan: PlanType = (profile?.subscription_plan as PlanType) ?? 'free';
      const limits = PLAN_LIMITS[plan];
      const now = new Date();

      const periodStart = limits.daily !== null
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: usage } = await supabase
        .from('token_usage')
        .select('tokens_used')
        .eq('user_id', user.id)
        .gte('created_at', periodStart);

      const totalUsed = (usage ?? []).reduce(
        (sum: number, row: { tokens_used: number }) => sum + (row.tokens_used ?? 0), 0
      );
      setState({ used: totalUsed, plan, loading: false });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => refresh());
    return () => subscription.unsubscribe();
  }, [refresh]);

  const addTokens = useCallback(async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || amount <= 0) return;
    setState(s => ({ ...s, used: s.used + amount }));
    await supabase.from('token_usage').insert({
      user_id: user.id,
      tokens_used: amount,
      created_at: new Date().toISOString(),
    });
  }, []);

  const limit = getLimit(state.plan);
  const remaining = Math.max(0, limit - state.used);
  const percentUsed = limit === Infinity ? 0 : Math.min(100, (state.used / limit) * 100);
  const isLimitReached = state.used >= limit;

  return (
    <TokenContext.Provider value={{ ...state, addTokens, limit, remaining, percentUsed, isLimitReached, refresh }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens(): TokenContextValue {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error('useTokens must be used inside <TokenProvider>');
  return ctx;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}
