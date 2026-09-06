'use client';

import { useLocale } from 'next-intl';
import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ProfileSelectOption } from './types';

interface ProfileDropdownProps {
  id: string;
  value: string;
  placeholder?: string;
  options: ProfileSelectOption[];
  errorMessage?: string;
  disabled?: boolean;
  searchable?: boolean;
  onChange: (value: string) => void;
}

export default function ProfileDropdown({
  id,
  value,
  placeholder,
  options,
  errorMessage,
  disabled = false,
  searchable = false,
  onChange,
}: ProfileDropdownProps) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase(locale);

    if (!normalizedSearchTerm) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLocaleLowerCase(locale).includes(normalizedSearchTerm)
    );
  }, [options, searchTerm, locale]);

  return (
    <div className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={[
          'flex h-[52px] w-full items-center justify-between rounded-full border bg-[#f8fafc] px-4 text-start text-sm leading-6 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          errorMessage
            ? 'border-[var(--color-border-error)] bg-[var(--color-bg-error-subtle)]'
            : 'border-[#e2e8f0] focus:border-[var(--color-border-focus)]',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={`min-w-0 truncate ${selectedOption ? 'text-[#434343]' : 'text-[#979797]'}`}
        >
          <bdi>{selectedOption?.label ?? placeholder}</bdi>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#979797]" />
      </button>

      {isOpen && (
        <div className="absolute start-0 z-30 mt-2 max-h-72 w-full overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.12)]">
          {searchable && (
            <div className="border-b border-[#e2e8f0] p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#979797]" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={locale === 'ar' ? 'ابحث' : 'Search'}
                  className="h-10 w-full rounded-full border border-[#e2e8f0] bg-[#f8fafc] ps-9 pe-3 text-start text-sm outline-none focus:border-[var(--color-border-focus)]"
                />
              </div>
            </div>
          )}

          <ul role="listbox" aria-labelledby={id} className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={[
                    'flex w-full items-center justify-start px-4 py-2 text-start text-sm transition-colors hover:bg-[#f8fafc]',
                    option.value === value ? 'font-bold text-[#f97316]' : 'text-[#434343]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <bdi>{option.label}</bdi>
                </button>
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-4 py-3 text-center text-sm text-[#979797]">
                {locale === 'ar' ? 'لا توجد نتائج' : 'No results'}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
