import { type ReactNode, type InputHTMLAttributes } from 'react';
import { type FieldError } from 'react-hook-form';

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  error?: FieldError;
};

export function AuthInput({ label, icon, error, className, ...props }: AuthInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          {...props}
          className={`w-full rounded-lg border py-2.5 pe-9 ps-3 text-sm outline-none transition
            ${
              error
                ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
            } ${className ?? ''}`}
        />
        <span className="absolute inset-y-0 end-3 my-auto text-gray-400">{icon}</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
