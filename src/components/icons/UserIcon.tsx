import type { SVGProps } from 'react';

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="9" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M3.5 15c0-2.9 2.462-5.25 5.5-5.25S14.5 12.1 14.5 15"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
