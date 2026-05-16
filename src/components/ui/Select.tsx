import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-zinc-300">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-3 py-2 pr-8 text-sm bg-zinc-900 border border-zinc-700 rounded-lg
              text-zinc-100 appearance-none cursor-pointer transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60
              hover:border-zinc-600 ${className}
            `}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
