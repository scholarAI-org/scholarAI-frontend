'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export type DeleteEntityType = 'language' | 'experience' | 'skill' | 'document';

interface DeleteConfirmationModalProps {
  open: boolean;
  entityType: DeleteEntityType;
  itemName: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
}

const emptySubscribe = () => () => undefined;

const deleteMessages: Record<
  DeleteEntityType,
  { title: string; getDescription: (name: string) => React.ReactNode }
> = {
  language: {
    title: 'حذف اللغة',
    getDescription: (name) => (
      <>
        هل أنت متأكد من حذف لغة
        <br />
        <strong>«{name}»؟</strong>
      </>
    ),
  },
  experience: {
    title: 'حذف الخبرة',
    getDescription: (name) => (
      <>
        هل أنت متأكد من حذف خبرة
        <br />
        <strong>«{name}»؟</strong>
      </>
    ),
  },
  skill: {
    title: 'حذف المهارة',
    getDescription: (name) => (
      <>
        هل أنت متأكد من حذف مهارة
        <br />
        <strong>«{name}»؟</strong>
      </>
    ),
  },
  document: {
    title: 'حذف المستند',
    getDescription: (name) => (
      <>
        هل أنت متأكد من حذف مستند
        <br />
        <strong>«{name}»؟</strong>
      </>
    ),
  },
};

export function DeleteConfirmationModal({
  open,
  entityType,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!open || !mounted) return null;

  const messages = deleteMessages[entityType];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a2243]/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div
        className="flex w-full max-w-[400px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl relative"
        dir="rtl"
      >
        <div className="flex flex-col items-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" strokeWidth={2} />
          </div>

          <h3 className="mb-3 text-[22px] font-bold text-[#1e293b]">{messages.title}</h3>

          <p className="mb-6 text-[15px] leading-relaxed text-[#64748b]">
            {messages.getDescription(itemName)}
          </p>

          <div className="mb-8 w-full rounded-2xl bg-red-50 py-3 text-center text-[14px] font-medium text-red-600 border border-red-100">
            لا يمكن التراجع عن هذا الإجراء
          </div>

          <div className="flex w-full items-center gap-3">
            <Button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 h-[48px] rounded-[24px] bg-[#E2E8F0] text-[#64748b] font-bold hover:bg-[#cbd5e1] border-none shadow-none"
            >
              إلغاء
            </Button>
            <Button
              onClick={onConfirm}
              isLoading={isDeleting}
              className="flex-1 h-[48px] rounded-[24px] bg-[#F07A7A] text-white font-bold hover:bg-red-500 border-none shadow-none"
            >
              حذف
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
