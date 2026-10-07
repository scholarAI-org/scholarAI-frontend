'use client';

import { animate, inView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { landingMotion } from '../motion';

const motionStyles = {
  '--landing-motion-feedback': `${landingMotion.feedback}s`,
  '--landing-motion-entrance': `${landingMotion.entrance}s`,
  '--landing-motion-ease': `cubic-bezier(${landingMotion.ease.join(',')})`,
} as CSSProperties;

/** Enhances the existing DOM; SSR and unobserved content always remain visible. */
export function LandingMotion({ children, className }: { children: ReactNode; className: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const revealed = useRef(new WeakSet<HTMLElement>());

  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;

    const running = new Map<HTMLElement, () => void>();
    const reveal = (element: HTMLElement) => {
      if (revealed.current.has(element)) return;
      revealed.current.add(element);
      const opacity = element.style.opacity;
      const transform = element.style.transform;
      const restore = () => {
        element.style.opacity = opacity;
        element.style.transform = transform;
        running.delete(element);
      };
      const index = Number(element.dataset.landingReveal || element.dataset.landingEntrance || 0);
      const controls = animate(
        element,
        { opacity: [0.65, 1], y: [landingMotion.distance, 0] },
        {
          duration: landingMotion.entrance,
          delay: Math.min(index * landingMotion.stagger, landingMotion.maxDelay),
          ease: [...landingMotion.ease],
        }
      );
      running.set(element, () => {
        controls.stop();
        restore();
      });
      void controls.then(restore);
    };

    root.querySelectorAll<HTMLElement>('[data-landing-entrance]').forEach(reveal);
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-landing-reveal]'));
    // One observer for all groups. An absent exit callback makes each entrance run once.
    const stopObserving =
      typeof IntersectionObserver === 'undefined'
        ? () => {}
        : inView(
            targets,
            (element) => {
              reveal(element as HTMLElement);
            },
            { amount: 0.12 }
          );
    const showFocusedContent = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const target = event.target.closest<HTMLElement>(
        '[data-landing-reveal], [data-landing-entrance]'
      );
      if (target) {
        // Keyboard navigation can scroll a group into view before its observer fires.
        revealed.current.add(target);
        running.get(target)?.();
      }
    };
    root.addEventListener('focusin', showFocusedContent);
    return () => {
      stopObserving();
      running.forEach((stop) => stop());
      root.removeEventListener('focusin', showFocusedContent);
    };
  }, [reducedMotion]);

  return (
    <div ref={ref} className={className} style={motionStyles}>
      {children}
    </div>
  );
}
