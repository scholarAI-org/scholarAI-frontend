'use client';

import { useState } from 'react';
import { getScholarshipImageSource } from '../lib/image-url';

interface ScholarshipImageProps {
  src?: string;
  alt: string;
  // Sizing classes from the caller, including a fixed aspect ratio.
  className?: string;
}

// Backend images use a native lazy <img> in a fixed-ratio box. Invalid URLs and
// load errors show the local neutral fallback, which is decorative (alt="").
export function ScholarshipImage({ src, alt, className = '' }: ScholarshipImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const image = getScholarshipImageSource(src, alt, failedSrc);

  return (
    <div className={`grid overflow-hidden bg-[#f1f5f9] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Scholarship images come from arbitrary backend hosts (plan section 25); next/image would need a broad host allowlist. This is the only exception. */}
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!image.isFallback) setFailedSrc(image.safeSrc);
        }}
        className="col-start-1 row-start-1 size-full min-h-0 min-w-0 object-cover"
      />
      {image.isFallback ? null : (
        <div
          aria-hidden
          className="col-start-1 row-start-1 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.5)_100%)]"
        />
      )}
    </div>
  );
}
