import type { LucideIcon } from 'lucide-react';
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

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
  badge?: string;
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
}
