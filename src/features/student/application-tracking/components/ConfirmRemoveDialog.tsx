'use client';

import { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { FOCUSABLE_SELECTOR, getFocusTrapTarget } from '@/features/student/layout/focus-trap';

interface ConfirmRemoveDialogProps {
  // The scholarship title being removed, or null when the dialog is closed.
  title: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

// Confirm before DELETE. A native modal <dialog> gives the inert background and
// Escape handling. The removal itself is optimistic, so the dialog closes on
// confirm and a failure is reported by the page notice.
export function ConfirmRemoveDialog({ title, onConfirm, onCancel }: ConfirmRemoveDialogProps) {
  const t = useTranslations('StudentTracking');
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const bodyId = useId();
  const open = title !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      aria-describedby={bodyId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      // Wrap Tab inside the dialog (same helper as the mobile navigation) instead of
      // letting focus leave for the browser UI.
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const focusable = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
        const target = getFocusTrapTarget(activeIndex, focusable.length, event.shiftKey);
        if (target !== null) {
          event.preventDefault();
          focusable[target].focus();
        }
      }}
      data-testid="tracking-remove-dialog"
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-3xl bg-white p-6 text-start shadow-2xl backdrop:bg-[#0a2243]/30"
    >
      {open ? (
        <div className="flex flex-col gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle aria-hidden className="size-6" />
          </div>
          <h2 id={headingId} className="text-lg font-bold text-[#1e293b]">
            {t('remove.title')}
          </h2>
          <p id={bodyId} className="text-sm leading-relaxed text-[#64748b]">
            {t('remove.body', { title })}
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-11 flex-1 rounded-full"
              onClick={onCancel}
            >
              {t('remove.cancel')}
            </Button>
            <Button
              type="button"
              className="h-11 flex-1 rounded-full bg-[#dc2626] hover:bg-[#b91c1c]"
              onClick={onConfirm}
              data-testid="tracking-remove-confirm"
            >
              {t('remove.confirm')}
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
