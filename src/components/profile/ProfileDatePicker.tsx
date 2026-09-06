'use client';

import { useLocale } from 'next-intl';
import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ProfileDatePickerProps {
  id: string;
  value: string;
  placeholder?: string;
  errorMessage?: string;
  maxDate?: string;
  onChange: (value: string) => void;
}

type SelectionStep = 'year' | 'month' | 'day';

const arabicWeekDays = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const arabicMonths = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

function parseIsoDate(value?: string) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!parts) return null;

  const date = new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string, locale: string) {
  const date = parseIsoDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return [
    ...Array.from({ length: firstDay.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ];
}

export default function ProfileDatePicker({
  id,
  value,
  placeholder,
  errorMessage,
  maxDate,
  onChange,
}: ProfileDatePickerProps) {
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const months = isArabic
    ? arabicMonths
    : Array.from({ length: 12 }, (_, month) =>
        new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, month, 1))
      );
  const weekDays = isArabic
    ? arabicWeekDays
    : Array.from({ length: 7 }, (_, day) =>
        new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + day))
      );
  const selectedDate = parseIsoDate(value);
  const maxDateValue = parseIsoDate(maxDate) ?? new Date();
  const initialDate = selectedDate ?? maxDateValue;
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<SelectionStep>('year');
  const [draftYear, setDraftYear] = useState(initialDate.getFullYear());
  const [draftMonth, setDraftMonth] = useState(initialDate.getMonth());
  const years = useMemo(
    () => Array.from({ length: 101 }, (_, index) => maxDateValue.getFullYear() - index),
    [maxDateValue]
  );
  const calendarDays = useMemo(
    () => getCalendarDays(draftYear, draftMonth),
    [draftMonth, draftYear]
  );

  function toggleCalendar() {
    if (!isOpen) {
      const startingDate = selectedDate ?? maxDateValue;
      setDraftYear(startingDate.getFullYear());
      setDraftMonth(startingDate.getMonth());
      setStep('year');
    }
    setIsOpen((current) => !current);
  }

  return (
    <div className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={toggleCalendar}
        className={[
          'flex h-[52px] w-full items-center justify-between rounded-full border bg-[#f8fafc] px-4 text-start text-sm leading-6 outline-none transition-colors',
          errorMessage
            ? 'border-[var(--color-border-error)] bg-[var(--color-bg-error-subtle)]'
            : 'border-[#e2e8f0] focus:border-[var(--color-border-focus)]',
        ].join(' ')}
      >
        <span className={value ? 'text-[#434343]' : 'text-[#979797]'}>
          {formatDisplayDate(value, locale) || placeholder}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[#979797]" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={isArabic ? 'اختيار تاريخ الميلاد' : 'Choose date of birth'}

          className="absolute start-0 z-30 mt-2 w-full rounded-2xl border border-[#e2e8f0] bg-white p-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
        >
          <p className="mb-3 text-center text-sm font-bold text-[#274383]">
            {step === 'year' && (isArabic ? 'اختر السنة' : 'Choose year')}
            {step === 'month' && `${isArabic ? 'اختر الشهر' : 'Choose month'} · ${draftYear}`}
            {step === 'day' && `${months[draftMonth]} ${draftYear}`}
          </p>

          {step === 'year' && (
            <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pe-1">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setDraftYear(year);
                    setStep('month');
                  }}
                  className={[
                    'h-9 rounded-full text-sm transition-colors hover:bg-[#f8fafc]',
                    year === draftYear
                      ? 'bg-[#274383] text-white hover:bg-[#274383]'
                      : 'text-[#434343]',
                  ].join(' ')}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {step === 'month' && (
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, monthIndex) => {
                const isDisabled =
                  draftYear === maxDateValue.getFullYear() && monthIndex > maxDateValue.getMonth();

                return (
                  <button
                    key={month}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      setDraftMonth(monthIndex);
                      setStep('day');
                    }}
                    className="h-9 rounded-full text-xs text-[#434343] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:text-[#d1d5db]"
                  >
                    {month}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setStep('year')}
                className="col-span-3 mt-1 text-xs font-bold text-[#274383]"
              >
                {isArabic ? 'تغيير السنة' : 'Change year'}
              </button>
            </div>
          )}

          {step === 'day' && (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#979797]">
                {weekDays.map((day) => (
                  <span key={day} className="py-1">
                    {day}
                  </span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) return <span key={`empty-${index}`} className="h-8" />;

                  const isoDate = toIsoDate(date);
                  const isSelected = value === isoDate;
                  const isDisabled = date > maxDateValue;

                  return (
                    <button
                      key={isoDate}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        onChange(isoDate);
                        setIsOpen(false);
                      }}
                      className={[
                        'flex h-8 items-center justify-center rounded-full text-xs transition-colors disabled:cursor-not-allowed disabled:text-[#d1d5db]',
                        isSelected
                          ? 'bg-[#274383] text-white'
                          : 'text-[#434343] hover:bg-[#f8fafc]',
                      ].join(' ')}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setStep('month')}
                className="mt-2 w-full text-xs font-bold text-[#274383]"
              >
                {isArabic ? 'تغيير الشهر' : 'Change month'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
