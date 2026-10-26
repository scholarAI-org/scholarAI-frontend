import {
  Bookmark,
  CircleCheck,
  CircleX,
  FileText,
  Lock,
  Send,
  SendHorizontal,
  type LucideIcon,
} from 'lucide-react';
import type { ScholarshipDiscoveryCard } from '@/features/student/scholarship-discovery/types';
import type { TrackingCardKey } from '../types';
import { trackingDateLabel } from './timestamps';

// Figma 2415:4656 status cards: indicator icon and label colour per card.
// lucide-react stands in for the Figma Hicon set, as in the rest of the student shell.
export const statusPresentation: Record<TrackingCardKey, { icon: LucideIcon; textClass: string }> =
  {
    saved: { icon: Bookmark, textClass: 'text-[#979797]' },
    preparing_documents: { icon: FileText, textClass: 'text-[#394d68]' },
    ready_to_apply: { icon: SendHorizontal, textClass: 'text-[#f59e0b]' },
    applied: { icon: Send, textClass: 'text-[#3b82f6]' },
    accepted: { icon: CircleCheck, textClass: 'text-[#16c172]' },
    rejected: { icon: CircleX, textClass: 'text-[#dc2626]/60' },
    closed: { icon: Lock, textClass: 'text-[#979797]' },
  };

export interface TrackingMeta {
  organization: string | null;
  // 'YYYY-MM-DD', or null when there is no readable deadline.
  deadlineDate: string | null;
  noDeadline: boolean;
  updatedDate: string | null;
}

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

// The Figma meta line: organization, deadline, last update. Each part is optional
// and a part that cannot be read is dropped instead of shown as a placeholder.
export function buildTrackingMeta(
  scholarship: Pick<
    ScholarshipDiscoveryCard,
    'organization_name' | 'university_name' | 'deadline' | 'no_deadline'
  >,
  updatedAt: string,
  timeZone?: string
): TrackingMeta {
  const noDeadline = scholarship.no_deadline === true;
  return {
    organization: text(scholarship.organization_name) ?? text(scholarship.university_name),
    deadlineDate: noDeadline ? null : trackingDateLabel(scholarship.deadline, timeZone),
    noDeadline,
    updatedDate: trackingDateLabel(updatedAt, timeZone),
  };
}

// Pieces for the meta line in display order. `kind` picks the translated template.
export function trackingMetaParts(meta: TrackingMeta) {
  const parts: Array<{
    kind: 'organization' | 'deadline' | 'noDeadline' | 'updated';
    value: string;
  }> = [];
  if (meta.organization) parts.push({ kind: 'organization', value: meta.organization });
  if (meta.noDeadline) parts.push({ kind: 'noDeadline', value: '' });
  else if (meta.deadlineDate) parts.push({ kind: 'deadline', value: meta.deadlineDate });
  if (meta.updatedDate) parts.push({ kind: 'updated', value: meta.updatedDate });
  return parts;
}

// 'a' / 'b' / 'c' -> 'a — b — c', the Figma separator.
export const joinMeta = (parts: readonly string[]) => parts.join(' — ');
