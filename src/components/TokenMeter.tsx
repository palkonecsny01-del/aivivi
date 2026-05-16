import { Zap, TrendingUp, ChevronRight, Infinity as InfinityIcon } from 'lucide-react';
import { useTokens, formatTokens, PLAN_LABELS, PLAN_LIMITS } from '../contexts/TokenContext';

interface TokenMeterProps {
  onUpgrade?: () => void;
  collapsed?: boolean;
}

export function TokenMeter({ onUpgrade, collapsed = false }: TokenMeterProps) {
  const { used, plan, limit, remaining, percentUsed, isLimitReached, loading } = useTokens();

  const isUnlimited = limit === null;
  const periodLabel = PLAN_LIMITS[plan]?.daily !== null ? 'nap' : 'hónap';
  const color = isUnlimited ? '#3B82F6' : percentUsed >= 90 ? '#EF4444' : percentUsed >= 70 ? '#F59E0B' : '#3B82F6';

  if (loading) {
    return <div className={`rounded-lg bg-zinc-800/50 animate-pulse ${collapsed ? 'h-8 w-8 mx-auto' : 'h-16 mx-2'}`} />;
  }

  if (collapsed) {
    return (
      <div className="flex justify-center mb-1">
        <div
          title={`${formatTokens(used)} token elhasználva (Admin / Végtelen)`}
          className="relative w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${color} 360deg, rgba(255,255,255,0.05) 0deg)` }}
        >
          <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center">
            <Zap size={9} style={{ color }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-2 rounded-lg bg-zinc-800/40 border border-zinc-700/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={11} style={{ color }} />
          <span className="text-[10px] font-semibold text-zinc-400">Token használat</span>
        </div>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
          {PLAN_LABELS[plan] || 'Admin'}
        </span>
      </div>

      <div className="h-1 rounded-full bg-zinc-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: '100%', backgroundColor: color }} />
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>{formatTokens(used)} használt</span>
        {isUnlimited ? (
          <span className="flex items-center gap-0.5 text-blue-400 font-medium">Végtelen <InfinityIcon size={10} /></span>
        ) : (
          <span>{formatTokens(limit as number)} / {periodLabel}</span>
        )}
      </div>

      <div className="text-[10px] text-zinc-600 flex items-center gap-1">
        <TrendingUp size={9} />
        <span>{isUnlimited ? 'Korlátlan keret (Admin)' : `${formatTokens(remaining as number)} maradt`}</span>
      </div>

      {/* Mindig elérhető gomb az adminnak is a csomagok ellenőrzéséhez */}
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 hover:border-blue-500/40 transition-all group"
        >
          <span className="text-[10px] font-semibold text-blue-400">Csomagok / Tesztelés</span>
          <ChevronRight size={10} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}