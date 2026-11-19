import Image from 'next/image';
import { NOTIFICATION_REGISTRY } from '../registry/registry';
import type { NotificationType } from '../model/types';

// Figma 2481:5019: a 42px rounded box tinted per type, with the type's icon in the middle.
export function NotificationIcon({ type }: { type: NotificationType }) {
  const { boxClass, icon } = NOTIFICATION_REGISTRY[type];
  return (
    <span
      aria-hidden
      data-notification-icon={type}
      className={`flex size-[42px] shrink-0 items-center justify-center rounded-xl ${boxClass}`}
    >
      {icon.kind === 'asset' ? (
        <Image src={icon.src} alt="" width={icon.width} height={icon.height} unoptimized />
      ) : (
        <icon.Icon className={`size-4 ${icon.className}`} />
      )}
    </span>
  );
}
