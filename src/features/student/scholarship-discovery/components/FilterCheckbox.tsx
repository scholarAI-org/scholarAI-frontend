'use client';

import { Check } from 'lucide-react';
import { useId, type ReactNode } from 'react';

interface FilterCheckboxProps {
  name: string;
  value: string;
  checked: boolean;
  label: ReactNode;
  onChange: () => void;
}

// Figma filters-panel checkbox (3100:7566): 16px outline box, orange outline and
// check when selected, no fill. A native input keeps keyboard and form semantics.
export function FilterCheckbox({ name, value, checked, label, onChange }: FilterCheckboxProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-4 shrink-0 place-items-center">
        <input
          id={id}
          type="checkbox"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="peer col-start-1 row-start-1 size-4 cursor-pointer appearance-none rounded-[4px] border-[0.8px] border-gray-400 bg-white transition-colors checked:border-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        />
        <Check
          aria-hidden
          strokeWidth={2.5}
          className="pointer-events-none col-start-1 row-start-1 size-3 text-orange-500 opacity-0 peer-checked:opacity-100"
        />
      </span>
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer text-xs leading-5 text-gray-500">
        {label}
      </label>
    </div>
  );
}
