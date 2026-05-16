import { Sparkles } from 'lucide-react';

interface VivienLogoProps {
  collapsed?: boolean;
}

export function VivienLogo({ collapsed = false }: VivienLogoProps) {
  const icon = (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md shadow-violet-500/30 shrink-0">
      <Sparkles size={14} className="text-white" />
    </div>
  );

  if (collapsed) return icon;

  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="flex flex-col leading-none">
        <span className="text-sm font-black tracking-tight text-zinc-100">
          AI <span className="text-violet-400">Vivien</span>
        </span>
        <span className="text-[9px] text-zinc-500 font-medium tracking-wide uppercase mt-0.5">
          Munkaterület
        </span>
      </div>
    </div>
  );
}
