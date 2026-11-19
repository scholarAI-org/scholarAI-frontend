import {
  isNotificationType,
  type NotificationActionData,
  type NotificationPage,
  type SkippedCounts,
  type StudentNotification,
} from '../model/types';
import { PARAMS_SCHEMAS } from './params';
import { itemShellSchema, listEnvelopeSchema, parseWire } from './wire';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// The action is optional context. An unreadable one never costs the student the
// notification: it is read as "no action".
function parseAction(raw: unknown): NotificationActionData | null {
  if (!isRecord(raw) || typeof raw.type !== 'string' || raw.type === '') return null;
  const target = raw.target_id;
  return {
    type: raw.type,
    targetId:
      typeof target === 'number' && Number.isSafeInteger(target) && target > 0 ? target : null,
  };
}

type ParsedItem =
  | { kind: 'ok'; notification: StudentNotification }
  | { kind: 'skipped'; reason: keyof SkippedCounts };

// One item. An unknown `type` is skipped (a newer backend must never break this version);
// a known type with a bad shell or bad params is skipped as malformed. Neither throws.
function parseItem(raw: unknown): ParsedItem {
  if (!isRecord(raw) || typeof raw.type !== 'string')
    return { kind: 'skipped', reason: 'malformed' };
  if (!isNotificationType(raw.type)) return { kind: 'skipped', reason: 'unknownType' };

  const shell = itemShellSchema.safeParse(raw);
  if (!shell.success) return { kind: 'skipped', reason: 'malformed' };
  const params = PARAMS_SCHEMAS[raw.type].safeParse(raw.params);
  if (!params.success) return { kind: 'skipped', reason: 'malformed' };

  return {
    kind: 'ok',
    notification: {
      id: shell.data.id,
      type: raw.type,
      params: params.data,
      createdAt: shell.data.created_at,
      isRead: shell.data.is_read,
      action: parseAction(raw.action),
    } as StudentNotification,
  };
}

// GET /api/notifications -> the renderable items in the server's order, plus counts of what
// was skipped. A bad envelope throws NotificationsContractError (the error state).
export function parseNotificationPage(raw: unknown): NotificationPage {
  const envelope = parseWire('list', listEnvelopeSchema, raw);
  const skipped: SkippedCounts = { unknownType: 0, malformed: 0 };
  const items: StudentNotification[] = [];

  for (const rawItem of envelope.items) {
    const parsed = parseItem(rawItem);
    if (parsed.kind === 'ok') items.push(parsed.notification);
    else skipped[parsed.reason] += 1;
  }

  return {
    items,
    page: envelope.page,
    pageSize: envelope.page_size,
    total: envelope.total,
    totalPages: envelope.total_pages,
    skipped,
  };
}
