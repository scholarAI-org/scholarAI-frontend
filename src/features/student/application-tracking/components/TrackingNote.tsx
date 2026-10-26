'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { NOTE_MAX_LENGTH } from '../constants';
import { getNoteDraftState, noteLength } from '../lib/notes';

interface TrackingNoteProps {
  notes: string | null;
  title: string;
  // Resolves when saved, rejects when it failed (the draft is kept).
  onSave: (notes: string) => Promise<unknown>;
}

// Figma "ملاحظاتي" block (2415:6323): the saved note in a bordered box. The Figma
// only shows the read state; editing is inline with a counter and Save / Cancel.
export function TrackingNote({ notes, title, onSave }: TrackingNoteProps) {
  const t = useTranslations('StudentTracking');
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const state = getNoteDraftState(draft, notes);
  const length = noteLength(draft);

  function startEditing() {
    setDraft(notes ?? '');
    setFailed(false);
    setEditing(true);
  }

  async function save() {
    if (state !== 'valid' || pending) return;
    setPending(true);
    setFailed(false);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3" data-testid="tracking-note">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[rgba(30,27,51,0.7)]">{t('note.label')}</h3>
        {!editing ? (
          <button
            type="button"
            onClick={startEditing}
            aria-label={t('note.editLabel', { title })}
            data-testid="tracking-note-edit"
            className="rounded-full px-3 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
          >
            {notes ? t('note.edit') : t('note.add')}
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="sr-only">
            {t('note.inputLabel')}
          </label>
          <textarea
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('note.placeholder')}
            rows={4}
            disabled={pending}
            aria-invalid={state === 'too-long'}
            data-testid="tracking-note-input"
            className="min-h-[89px] w-full resize-y rounded-xl border border-[#e2e8f0] bg-white p-2.5 text-sm leading-[22px] text-[#394d68] focus-visible:outline-2 focus-visible:outline-orange-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1 text-xs">
              <span
                className={
                  state === 'too-long' ? 'text-[var(--color-text-error)]' : 'text-[#979797]'
                }
                data-testid="tracking-note-counter"
              >
                {t('note.counter', { count: length, max: NOTE_MAX_LENGTH })}
              </span>
              {state === 'too-long' ? (
                <span role="alert" className="text-[var(--color-text-error)]">
                  {t('note.tooLong')}
                </span>
              ) : null}
              {failed ? (
                <span role="alert" className="text-[var(--color-text-error)]">
                  {t('note.saveFailed')}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full"
                disabled={pending}
                onClick={() => setEditing(false)}
              >
                {t('note.cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                disabled={state !== 'valid' || pending}
                isLoading={pending}
                onClick={save}
                data-testid="tracking-note-save"
              >
                {pending ? t('note.saving') : t('note.save')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="min-h-[89px] rounded-xl border border-[#e2e8f0] p-2.5 text-sm leading-[22px] text-[#394d68]"
          data-testid="tracking-note-text"
        >
          {notes ? (
            <p className="break-words whitespace-pre-wrap">{notes}</p>
          ) : (
            <p className="text-[#979797]">{t('note.empty')}</p>
          )}
        </div>
      )}
    </div>
  );
}
