import { Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { useTokens, formatTokens, PLAN_LABELS, PLAN_LIMITS } from '../contexts/TokenContext';

interface TokenMeterProps {
  onUpgrade?: () => void;
  collapsed?: boolean;
}

export function TokenMeter({ onUpgrade, collapsed = false }: TokenMeterProps) {
  const { used, plan, limit, remaining, percentUsed, isLimitReached, loading } = useTokens();

  const periodLabel = PLAN_LIMITS[plan].daily !== null ? 'nap' : 'hónap';

  const color =
    percentUsed >= 90 ? '#EF4444' :
    percentUsed >= 70 ? '#F59E0B' :
                        '#8B5CF6';

  if (loading) {
    return <div className={`rounded-lg bg-zinc-800/50 animate-pulse ${collapsed ? 'h-8 w-8 mx-auto' : 'h-16 mx-2'}`} />;
  }

  if (collapsed) {
    return (
      <div className="flex justify-center mb-1">
        <div
          title={`${formatTokens(used)} / ${formatTokens(limit)} token`}
          className="relative w-7 h-7 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${color} ${percentUsed * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
          }}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={11} style={{ color }} />
          <span className="text-[10px] font-semibold text-zinc-400">Token használat</span>
        </div>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {PLAN_LABELS[plan]}
        </span>
      </div>

      {/* Bar */}
      <div className="h-1 rounded-full bg-zinc-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, percentUsed)}%`, backgroundColor: color }}
        />
      </div>

      {/* Numbers */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span>{formatTokens(used)} használva</span>
        <span>{formatTokens(limit)} / {periodLabel}</span>
      </div>

      {/* Status / Upgrade */}
      {isLimitReached ? (
        <p className="text-[10px] text-red-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
          Limit elérve
        </p>
      ) : (
        <p className="text-[10px] text-zinc-600 flex items-center gap-1">
          <TrendingUp size={9} />
          {formatTokens(remaining)} maradt
        </p>
      )}

      {plan === 'free' && onUpgrade && (
        <button
          onClick={onUpgrade}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/25 hover:border-violet-500/40 transition-all group"
        >
          <span className="text-[10px] font-semibold text-violet-400">Csomag váltás</span>
          <ChevronRight size={10} className="text-violet-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}
