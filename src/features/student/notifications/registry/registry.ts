import {
  Archive,
  CircleAlert,
  CircleCheck,
  FilePen,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '../model/types';

// The only place that knows how each of the six notification types looks. (Their wire params
// live in adapter/params.ts, their sentences in the StudentNotifications messages under
// `types.<type>`.) Adding a type means one entry here, one in PARAMS_SCHEMAS and its messages;
// a test fails when any of the three is missing.
//
// Figma 2481:4980. The design's icons are Font Awesome characters; the nearest lucide icons are
// used, except the deadline clock, which is a real SVG asset (public/images/student/notifications).

export type NotificationIcon =
  | { kind: 'asset'; src: string; width: number; height: number }
  | { kind: 'icon'; Icon: LucideIcon; className: string };

export interface RegistryEntry {
  // The tinted 42px box behind the icon.
  boxClass: string;
  icon: NotificationIcon;
}

export const NOTIFICATION_REGISTRY = {
  deadline_reminder: {
    boxClass: 'bg-[rgba(255,141,40,0.1)]',
    icon: {
      kind: 'asset',
      src: '/images/student/notifications/time-circle.svg',
      width: 18,
      height: 19,
    },
  },
  scholarship_match: {
    boxClass: 'bg-[#f1f1fb]',
    icon: { kind: 'icon', Icon: WandSparkles, className: 'text-[#274383]' },
  },
  saved_scholarship_updated: {
    boxClass: 'bg-[rgba(22,193,114,0.06)]',
    icon: { kind: 'icon', Icon: CircleCheck, className: 'text-[#16c172]' },
  },
  scholarship_archived: {
    boxClass: 'bg-[rgba(255,56,60,0.1)]',
    icon: { kind: 'icon', Icon: Archive, className: 'text-[rgba(220,38,38,0.6)]' },
  },
  profile_incomplete: {
    boxClass: 'bg-[rgba(255,141,40,0.1)]',
    icon: { kind: 'icon', Icon: CircleAlert, className: 'text-orange-500' },
  },
  document_analysis_ready: {
    boxClass: 'bg-[rgba(0,136,255,0.1)]',
    icon: { kind: 'icon', Icon: FilePen, className: 'text-[#8b5cf6]' },
  },
} satisfies Record<NotificationType, RegistryEntry>;
