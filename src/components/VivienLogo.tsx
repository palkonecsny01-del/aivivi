interface VivienLogoProps {
  collapsed?: boolean;
}

export function VivienLogo({ collapsed = false }: VivienLogoProps) {
  const icon = (
    <img 
      src="/logo.png" 
      alt="AI Vivien" 
      className="w-7 h-7 object-contain shrink-0"
    />
  );

  if (collapsed) return icon;

  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="flex flex-col leading-none">
        <span className="text-sm font-black tracking-tight text-zinc-100">
          AI <span className="text-blue-500">Vivien</span>
        </span>
        <span className="text-[9px] text-zinc-500 font-medium tracking-wide uppercase mt-0.5">
          Munkaterület
        </span>
      </div>
    </div>
  );
}