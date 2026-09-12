'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              logo_alignment?: string;
              width?: string | number;
              locale?: string;
            }
          ) => void;
          prompt: (
            notification?: (notification: {
              isNotDisplayed: boolean;
              isSkippedMoment: boolean;
              getNotDisplayedReason: () => string;
            }) => void
          ) => void;
          revoke?: (hint: string, done: () => void) => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  mode: 'login' | 'signup';
  className?: string;
}

export function GoogleAuthButton({ mode, className }: GoogleAuthButtonProps) {
  const t = useTranslations(mode === 'login' ? 'Login' : 'Register');
  const googleAuthMutation = useGoogleAuth();
  const [scriptLoaded, setScriptLoaded] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.google?.accounts?.id);
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const hiddenGoogleButtonRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Load Google Identity Services SDK script dynamically if not already present
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.id) {
      return;
    }

    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      const handleLoad = () => setScriptLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      setLocalError(t('googleAuthError') || 'Unable to sign in with Google. Please try again.');
    };
    document.head.appendChild(script);
  }, [t]);

  // Initialize GIS and render hidden button once script is ready
  useEffect(() => {
    if (
      !scriptLoaded ||
      !clientId ||
      typeof window === 'undefined' ||
      !window.google?.accounts?.id
    ) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response?.credential) {
            setLocalError(null);
            googleAuthMutation.mutate(response.credential, {
              onError: (err) => {
                setLocalError(err.message || t('googleAuthError'));
              },
            });
          } else {
            setLocalError(t('googleAuthError'));
          }
        },
      });

      if (hiddenGoogleButtonRef.current) {
        hiddenGoogleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(hiddenGoogleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 320,
        });
      }
    } catch {
      // Ignore initialization error gracefully
    }
  }, [scriptLoaded, clientId, googleAuthMutation, t]);

  const handleButtonClick = () => {
    setLocalError(null);

    if (!clientId || clientId.includes('your-google-client-id')) {
      setLocalError(t('googleAuthError'));
      return;
    }

    if (!scriptLoaded || !window.google?.accounts?.id) {
      setLocalError(t('googleAuthError'));
      return;
    }

    // Trigger Google Auth prompt or click standard rendered hidden button
    const googleIframe = hiddenGoogleButtonRef.current?.querySelector(
      'div[role="button"]'
    ) as HTMLElement | null;
    if (googleIframe) {
      googleIframe.click();
    } else {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          setLocalError(t('googleAuthError'));
        }
      });
    }
  };

  const isLoading = googleAuthMutation.isPending;
  const buttonText = isLoading
    ? t('signingIn')
    : mode === 'login'
      ? t('continueWithGoogle')
      : t('signUpWithGoogle');

  return (
    <div className="w-full">
      {/* Hidden native Google button container used to capture clicks seamlessly */}
      <div ref={hiddenGoogleButtonRef} aria-hidden="true" className="hidden" />

      <Button
        type="button"
        variant="secondary"
        onClick={handleButtonClick}
        isLoading={isLoading}
        disabled={isLoading}
        className={`relative w-full ${className || ''}`}
      >
        {!isLoading && <GoogleIcon className="h-5 w-5 shrink-0" />}
        <span>{buttonText}</span>
      </Button>

      {(localError || googleAuthMutation.error) && (
        <p className="mt-2 rounded-lg bg-[var(--color-bg-error-subtle)] px-3 py-2 text-xs text-[var(--color-text-error)] text-start">
          {localError || googleAuthMutation.error?.message || t('googleAuthError')}
        </p>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}
