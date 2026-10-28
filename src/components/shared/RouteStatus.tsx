import type { ReactNode } from 'react';

/**
 * Shared presentation for the whole-page states a visitor can land on:
 * the 404 page and the error boundary. Copy and actions come from the caller,
 * so this stays free of translations and of client-side state.
 */
export function RouteStatus({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-[var(--color-bg-page)] px-6 py-16">
      <div className="w-full max-w-[560px] rounded-[20px] bg-[var(--color-bg-surface)] px-6 py-10 text-center shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:px-10">
        <p
          aria-hidden="true"
          className="text-[56px] font-extrabold leading-none text-[var(--color-primary)]"
        >
          {code}
        </p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
    </main>
  );
}
