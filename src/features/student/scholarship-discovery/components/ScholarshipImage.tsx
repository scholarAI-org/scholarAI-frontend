'use client';

import { useState } from 'react';
import { getSafeImageUrl } from '../lib/image-url';

const FALLBACK_SRC = '/images/student/scholarship-image-fallback.svg';

interface ScholarshipImageProps {
  src?: string;
  alt: string;
  // Sizing classes from the caller, including a fixed aspect ratio.
  className?: string;
}

// Backend images use a native lazy <img> in a fixed-ratio box. Invalid URLs and
// load errors show the local neutral fallback, which is decorative (alt="").
export function ScholarshipImage({ src, alt, className = '' }: ScholarshipImageProps) {
  const safeSrc = getSafeImageUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !safeSrc || failedSrc === safeSrc;

  return (
    <div className={`grid overflow-hidden bg-[#f1f5f9] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Scholarship images come from arbitrary backend hosts (plan section 25); next/image would need a broad host allowlist. This is the only exception. */}
      <img
        src={showFallback ? FALLBACK_SRC : safeSrc}
        alt={showFallback ? '' : alt}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!showFallback) setFailedSrc(safeSrc);
        }}
        className="col-start-1 row-start-1 size-full object-cover"
      />
      {showFallback ? null : (
        <div
          aria-hidden
          className="col-start-1 row-start-1 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.5)_100%)]"
        />
      )}
    </div>
  );
}
