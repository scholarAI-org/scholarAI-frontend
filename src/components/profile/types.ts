import type { InputHTMLAttributes, ReactNode } from 'react';

export interface ProfileUser {
  name: string;
  initials: string;
  avatarUrl?: string | null;
  role?: string;
  roleIcon?: ReactNode;
  headline?: string;
}

export interface ProfileCompletion {
  label: string;
  value: number;
}

export type StepStatus = 'completed' | 'active' | 'upcoming';

export interface ProfileStep {
  id: string;
  label: string;
  number: string;
  status: StepStatus;
}

export type ProfileFieldKind = 'text' | 'select' | 'date' | 'phone';

export interface ProfileSelectOption {
  value: string;
  label: string;
}

export interface ProfileCallingCodeOption extends ProfileSelectOption {
  countryCode: string;
  dialCode: string;
}

export interface ProfileFieldData {
  id: string;
  label: string;
  placeholder?: string;
  kind?: ProfileFieldKind;
  inputType?: InputHTMLAttributes<HTMLInputElement>['type'];
  dir?: 'ltr' | 'rtl' | 'auto';
  disabled?: boolean;
  options?: ProfileSelectOption[];
  callingCodeOptions?: ProfileCallingCodeOption[];
  searchable?: boolean;
  required?: boolean;
  optionalLabel?: string;
}
