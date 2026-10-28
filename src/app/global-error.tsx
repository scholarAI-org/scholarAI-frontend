'use client';

import { useEffect } from 'react';

/**
 * Replaces the whole document when the root layout itself fails, so the
 * NextIntlClientProvider and the app's styles are both gone. Everything here is
 * therefore inline and written in the default locale (Arabic, with an English
 * line underneath) rather than read from the message catalogues, which would
 * pull the whole bundle into this boundary.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error', error.digest ?? error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#f8fafc',
          color: '#1e293b',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: '520px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px' }}>حدث خطأ ما</h1>
          <p style={{ margin: '0 0 8px', lineHeight: 1.7, color: '#475569' }}>
            حدث خطأ غير متوقع منع تحميل التطبيق. حاول مرة أخرى.
          </p>
          <p style={{ margin: '0 0 24px', lineHeight: 1.7, color: '#64748b' }} lang="en" dir="ltr">
            Something went wrong and the app could not load. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: 'pointer',
              border: 0,
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#f97316',
            }}
          >
            إعادة المحاولة / Try again
          </button>
        </main>
      </body>
    </html>
  );
}
