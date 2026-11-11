'use client';

import { useState, type ComponentProps, type Ref } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormField } from '@/components/shared/FormField';

type PasswordFieldProps = Omit<ComponentProps<typeof FormField>, 'type' | 'icon'> & {
  showLabel: string;
  hideLabel: string;
  // React 19 passes `ref` as a prop, which is how react-hook-form's register() reaches the input.
  ref?: Ref<HTMLInputElement>;
};

// The shared FormField with a show/hide toggle at the end. Passwords are always typed left
// to right, in both languages. The toggle is a real button inside the field's icon slot
// (which is pointer-events-none by default, hence pointer-events-auto) and is announced as
// pressed while the password is visible.
export function PasswordField({ showLabel, hideLabel, ...fieldProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      {...fieldProps}
      type={visible ? 'text' : 'password'}
      dir="ltr"
      iconPosition="end"
      icon={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="pointer-events-auto flex size-8 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          {visible ? (
            <EyeOff aria-hidden className="size-[18px]" />
          ) : (
            <Eye aria-hidden className="size-[18px]" />
          )}
        </button>
      }
    />
  );
}
