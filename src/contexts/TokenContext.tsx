import React, { createContext, useContext, useState, useEffect } from 'react';

export const PLAN_LABELS: Record<string, string> = {
  free: 'Ingyenes',
  pro: 'Pro',
  business: 'Business',
  admin: 'Admin'
};

export const PLAN_LIMITS: Record<string, { daily: number | null; monthly: number | null }> = {
  free: { daily: 10000, monthly: 300000 },
  pro: { daily: null, monthly: 2000000 },
  business: { daily: null, monthly: 10000000 },
  admin: { daily: null, monthly: null } // null = Végtelen
};

export function formatTokens(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
  return num.toString();
}

interface TokenContextType {
  used: number;
  plan: 'free' | 'pro' | 'business' | 'admin';
  limit: number | null;
  remaining: number | null;
  percentUsed: number;
  isLimitReached: boolean;
  loading: boolean;
  refreshTokens: () => Promise<void>;
  addTokens: (amount: number) => void;
  setAdminMode: (isAdmin: boolean) => void;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  // Betöltés a localStorage-ból, hogy frissítésnél se vesszen el az érték!
  const [used, setUsed] = useState<number>(() => {
    const saved = localStorage.getItem('vivien_tokens_used');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [plan, setPlan] = useState<'free' | 'pro' | 'business' | 'admin'>(() => {
    const saved = localStorage.getItem('vivien_user_plan');
    return (saved as any) || 'free';
  });

  const [loading] = useState(false);

  // Perzisztencia: Ha változik az érték, elmentjük
  useEffect(() => {
    localStorage.setItem('vivien_tokens_used', used.toString());
  }, [used]);

  useEffect(() => {
    localStorage.setItem('vivien_user_plan', plan);
  }, [plan]);

  const limit = PLAN_LIMITS[plan].daily !== null ? PLAN_LIMITS[plan].daily : PLAN_LIMITS[plan].monthly;
  const isUnlimited = limit === null;

  const remaining = isUnlimited ? null : Math.max(0, limit - used);
  const percentUsed = isUnlimited ? 0 : (used / limit) * 100;
  const isLimitReached = isUnlimited ? false : used >= limit;

  const refreshTokens = async () => {
    // Későbbi adatbázis szinkronizáció helye
  };

  const addTokens = (amount: number) => {
    setUsed(prev => prev + amount);
  };

  const setAdminMode = (isAdmin: boolean) => {
    setPlan(isAdmin ? 'admin' : 'free');
  };

  return (
    <TokenContext.Provider value={{ 
      used, plan, limit, remaining, percentUsed, isLimitReached, 
      loading, refreshTokens, addTokens, setAdminMode 
    }}>
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
}