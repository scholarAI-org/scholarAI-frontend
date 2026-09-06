'use client';

import { useTranslations } from 'next-intl';
import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { ProfileFormActions } from '@/components/profile/ProfileFormActions';
import { ProfileSaveContinueButton } from '@/components/profile/ProfileSaveContinueButton';
import { ApiError } from '@/lib/api-client';
import {
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '../hooks/useExperiences';
import type { Experience, ExperienceType } from '../schemas/experiences.schema';

const emptySubscribe = () => () => undefined;

export function ExperiencesAndActivitiesSection({ onSavedNext }: { onSavedNext?: () => void }) {
  const t = useTranslations('Experiences');
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const query = useExperiences();
  const createMutation = useCreateExperience();
  const updateMutation = useUpdateExperience();
  const deleteMutation = useDeleteExperience();

  const experiences = query.data || [];
  const isLoading = query.isLoading;

  const authError = [
    query.error,
    createMutation.error,
    updateMutation.error,
    deleteMutation.error,
  ].some((error) => error instanceof ApiError && (error.status === 401 || error.status === 403));

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [type, setType] = useState<ExperienceType>('WORK');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [experienceToDelete, setExperienceToDelete] = useState<{ id: number; name: string } | null>(
    null
  );

  const resetForm = () => {
    setEditingId(null);
    setType('WORK');
    setTitle('');
    setOrganization('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setDescription('');
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (exp: Experience) => {
    resetForm();
    setEditingId(exp.id!);
    setType(exp.experience_type);
    setTitle(exp.title);
    setOrganization(exp.organization);
    setStartDate(exp.start_date);
    if (exp.end_date) setEndDate(exp.end_date);
    setIsCurrent(exp.is_current);
    if (exp.description) setDescription(exp.description);
    setShowModal(true);
  };

  const handleDelete = (id: number, name: string) => {
    setExperienceToDelete({ id, name });
  };

  const confirmDelete = () => {
    if (experienceToDelete) {
      deleteMutation.mutate(experienceToDelete.id, {
        onSuccess: () => setExperienceToDelete(null),
      });
    }
  };

  const handleSave = () => {
    setFormError(null);
    if (!title.trim() || !organization.trim() || !startDate) {
      setFormError('Please fill all required fields');
      return;
    }
    if (!isCurrent && endDate && endDate < startDate) {
      setFormError(t('errors.invalidDates'));
      return;
    }

    const payload = {
      experience_type: type,
      title: title.trim(),
      organization: organization.trim(),
      start_date: startDate,
      end_date: isCurrent ? null : endDate || null,
      is_current: isCurrent,
      description: description.trim() || null,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        { onSuccess: () => setShowModal(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setShowModal(false),
      });
    }
  };

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex flex-col gap-6 w-full max-w-full">
      <div className="rounded-[32px] bg-white p-8 shadow-sm">
        <h2 className="mb-2 text-[20px] font-bold text-[#1e293b]">{t('title')}</h2>
        <p className="mb-8 text-[14px] text-[#64748b]">{t('subtitle')}</p>

        {authError && (
          <div className="rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 mb-4 text-sm text-[var(--color-text-error)]">
            Please sign in again.
          </div>
        )}

        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-slate-400">Loading...</div>
        ) : experiences.length === 0 ? (
          <div
            onClick={handleOpenAdd}
            className="flex flex-col cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] py-12 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm text-slate-400">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <h3 className="mb-1 text-[16px] font-bold text-[#1e293b]">{t('emptyTitle')}</h3>
            <p className="text-[14px] text-[#64748b]">{t('emptySubtitle')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-2xl border border-slate-200 p-5 bg-white hover:border-slate-300 transition-colors gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-[#1e293b] text-lg">{exp.title}</h3>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                      {t(`types.${exp.experience_type}`)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{exp.organization}</p>
                  <p className="text-slate-400 text-xs">
                    {exp.start_date} &rarr; {exp.is_current ? t('fields.isCurrent') : exp.end_date}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenEdit(exp)}
                    disabled={isMutating}
                    className="flex-1 sm:flex-none h-10 px-4 rounded-xl"
                  >
                    {t('actions.edit')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(exp.id!, exp.title)}
                    disabled={isMutating}
                    className="flex-1 sm:flex-none h-10 px-4 rounded-xl text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    {t('actions.delete')}
                  </Button>
                </div>
              </div>
            ))}

            <button
              onClick={handleOpenAdd}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#cbd5e1] bg-white py-4 text-[15px] font-medium text-[#64748b] hover:bg-slate-50 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {t('emptyTitle')}
            </button>
          </div>
        )}
      </div>

      <ProfileFormActions>
        <ProfileSaveContinueButton
          onClick={() => {
            if (typeof onSavedNext === 'function') onSavedNext();
          }}
          disabled={isLoading}
        />
      </ProfileFormActions>

      {/* Add/Edit Modal Overlay */}
      {showModal &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a2243]/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="flex w-full max-w-[500px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl relative max-h-[90vh]">
              {/* Header - Fixed */}
              <div className="flex shrink-0 items-start justify-between border-b border-slate-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-right">
                    <h3 className="text-[18px] font-bold text-[#1e293b]">
                      {editingId ? t('editModalTitle') : t('modalTitle')}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-[#64748b]">{t('modalSubtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isMutating}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0] transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                {formError && (
                  <div className="mb-4 rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-sm text-[var(--color-text-error)]">
                    {formError}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Experience Type */}
                  <div className="space-y-3">
                    <label className="text-[15px] font-bold text-[#1e293b]">
                      {t('fields.type')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        ['WORK', 'RESEARCH', 'VOLUNTEER', 'STUDENT_ACTIVITY'] as ExperienceType[]
                      ).map((opt) => {
                        const isSelected = type === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setType(opt)}
                            className={`rounded-[20px] border px-4 py-2 text-[14px] font-medium transition-colors ${
                              isSelected
                                ? 'border-[#1d4ed8] bg-[#1d4ed8]/5 text-[#1d4ed8]'
                                : 'border-slate-200 bg-white text-[#64748b] hover:border-slate-300'
                            }`}
                          >
                            {t(`types.${opt}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <label htmlFor="exp-title" className="text-[15px] font-bold text-[#1e293b]">
                      {t('fields.title')}
                    </label>
                    <Input
                      id="exp-title"
                      placeholder={t('fields.titlePlaceholder')}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isMutating}
                      className="w-full rounded-[16px] bg-[#f8fafc] h-12"
                    />
                  </div>

                  {/* Organization */}
                  <div className="space-y-2">
                    <label htmlFor="exp-org" className="text-[15px] font-bold text-[#1e293b]">
                      {t('fields.organization')}
                    </label>
                    <Input
                      id="exp-org"
                      placeholder={t('fields.organizationPlaceholder')}
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      disabled={isMutating}
                      className="w-full rounded-[16px] bg-[#f8fafc] h-12"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="exp-start" className="text-[15px] font-bold text-[#1e293b]">
                        {t('fields.startDate')}
                      </label>
                      <input
                        type="date"
                        id="exp-start"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={isMutating}
                        className="flex h-12 w-full rounded-[16px] bg-[#f8fafc] border border-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="exp-end" className="text-[15px] font-bold text-[#1e293b]">
                        {t('fields.endDate')}
                      </label>
                      <input
                        type="date"
                        id="exp-end"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={isMutating || isCurrent}
                        className="flex h-12 w-full rounded-[16px] bg-[#f8fafc] border border-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="exp-current"
                      checked={isCurrent}
                      onChange={(e) => {
                        setIsCurrent(e.target.checked);
                        if (e.target.checked) setEndDate('');
                      }}
                    />
                    <label
                      htmlFor="exp-current"
                      className="text-sm text-slate-700 cursor-pointer select-none"
                    >
                      {t('fields.isCurrent')}
                    </label>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label htmlFor="exp-desc" className="text-[15px] font-bold text-[#1e293b]">
                      {t('fields.description')}{' '}
                      <span className="text-slate-400 font-normal">{t('fields.optional')}</span>
                    </label>
                    <textarea
                      id="exp-desc"
                      placeholder={t('fields.descriptionPlaceholder')}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isMutating}
                      rows={4}
                      className="flex w-full rounded-[16px] bg-[#f8fafc] border border-transparent px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Footer - Fixed */}
              <div className="flex shrink-0 items-center justify-between border-t border-slate-100 p-6 bg-white rounded-b-[32px]">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={isMutating}
                  className="h-12 rounded-[20px] px-6 font-semibold text-[#64748b] bg-[#f8fafc] border-transparent hover:bg-slate-200"
                >
                  {t('cancelBtn')}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isMutating}
                  className="h-12 rounded-[20px] bg-[#1e3a8a] px-8 font-bold text-white hover:bg-[#1e40af]"
                >
                  {editingId ? t('actions.edit') : t('addBtn')}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <DeleteConfirmationModal
        open={experienceToDelete !== null}
        entityType="experience"
        itemName={experienceToDelete?.name || ''}
        isDeleting={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setExperienceToDelete(null)}
      />
    </div>
  );
}
