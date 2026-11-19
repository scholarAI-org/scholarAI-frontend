'use client';

import { useId } from 'react';
import { Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { StudentNotification } from '../model/types';
import { resolveAction } from '../registry/actions';
import { buildNotificationCopy, type NotificationTranslator } from '../registry/copy';
import { NotificationIcon } from './NotificationIcon';

interface NotificationCardProps {
  notification: StudentNotification;
  // The student's clock, for the relative time.
  now: Date;
  // SCHOLARSHIP_DETAILS_ENABLED, from the Server Component: decides whether a details action shows.
  detailsEnabled: boolean;
  // Marks the notification read. Without it the card is display-only.
  onMarkRead?: (id: number) => void;
}

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500';

// Figma 2481:4987 and 2481:5005. From the reading start: the type icon, the text, and an end
// column with the "New" pill (unread) above the action. Below sm the pill stays on the title
// row and the action drops under the text at full width (the wrapper with `contents` lets the
// two flex items rearrange without being duplicated). All sentences are built from the type
// and params here; nothing the backend sends is shown as a sentence.
export function NotificationCard({
  notification,
  now,
  detailsEnabled,
  onMarkRead,
}: NotificationCardProps) {
  const t = useTranslations('StudentNotifications');
  const locale = useLocale();
  const titleId = useId();
  const hintId = useId();

  const copy = buildNotificationCopy(notification, {
    t: t as unknown as NotificationTranslator,
    locale,
    now,
  });
  const action = resolveAction(notification, { detailsEnabled });
  const unread = !notification.isRead;
  const markRead = unread && onMarkRead ? () => onMarkRead(notification.id) : undefined;

  const text = (
    <>
      <span
        id={titleId}
        className="line-clamp-2 block text-sm font-medium break-words text-[#434343]"
      >
        <bdi>{copy.title}</bdi>
      </span>
      <span className="mt-1 block text-xs leading-5 break-words text-[#979797]">
        <bdi>{copy.body}</bdi>
      </span>
      <span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs leading-5 text-[#b1b1b1]">
        <Clock aria-hidden className="size-3 shrink-0" />
        {copy.time ? (
          <time dateTime={notification.createdAt} title={copy.exactTime}>
            {copy.time}
          </time>
        ) : null}
        {copy.reminder ? (
          <>
            <span aria-hidden>·</span>
            <span>{copy.reminder}</span>
          </>
        ) : null}
      </span>
    </>
  );

  return (
    <li
      data-notification-type={notification.type}
      data-unread={unread ? 'true' : 'false'}
      className={`min-w-0 rounded-2xl border bg-white p-4 sm:px-5 sm:py-[18px] ${
        unread ? 'border-orange-500' : 'border-[#e2e8f0]'
      }`}
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 sm:flex-nowrap">
        <NotificationIcon type={notification.type} />

        {markRead ? (
          <>
            {/* The text is the mark-as-read control: a real button holding only phrasing
                content, with the hint as its description. The action is a sibling, never
                nested inside it. */}
            <button
              type="button"
              onClick={markRead}
              aria-describedby={hintId}
              className={`block min-w-0 flex-1 rounded-lg text-start ${focusRing}`}
            >
              {text}
            </button>
            <span id={hintId} className="sr-only">
              {t('markRead.hint')}
            </span>
          </>
        ) : (
          <div className="min-w-0 flex-1">{text}</div>
        )}

        <div className="contents sm:flex sm:shrink-0 sm:flex-col sm:items-end sm:gap-2">
          {unread ? (
            <span
              data-testid="notification-new"
              className="inline-flex shrink-0 items-center rounded-full bg-[rgba(255,141,40,0.1)] px-[11px] py-[4.5px] text-xs leading-5 text-orange-500"
            >
              {t('new')}
            </span>
          ) : null}
          {action ? (
            <Link
              href={action.href}
              aria-describedby={titleId}
              onClick={markRead}
              className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#e2e8f0] bg-white px-[17px] text-xs text-[rgba(30,27,51,0.7)] transition-colors hover:bg-[#f8fafc] sm:min-h-[38px] sm:w-auto ${focusRing}`}
            >
              {t(action.labelKey)}
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}
