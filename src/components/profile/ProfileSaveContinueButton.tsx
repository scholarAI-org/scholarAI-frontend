'use client';

import { ChevronLeft } from 'lucide-react';
import type { MouseEventHandler } from 'react';
import { Button } from '@/components/ui/Button';

interface ProfileSaveContinueButtonProps {
  type?: 'submit' | 'button';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  label?: string;
  className?: string;
}

export function ProfileSaveContinueButton({
  type = 'button',
  isLoading = false,
  disabled = false,
  onClick,
  label = 'حفظ ومتابعة',
  className = '',
}: ProfileSaveContinueButtonProps) {
  return (
    <Button
      type={type}
      disabled={disabled || isLoading}
      isLoading={isLoading}
      onClick={onClick}
      className={`h-[52px] w-full min-w-[185px] rounded-full bg-[#1e3a8a] px-6 text-[16px] font-bold text-white transition-colors hover:bg-[#1e40af] disabled:opacity-50 sm:w-auto ${className}`}
    >
      <span>{label}</span>
      {!isLoading && <ChevronLeft className="h-[18px] w-[18px] shrink-0 ltr:rotate-180" />}
    </Button>
  );
}
