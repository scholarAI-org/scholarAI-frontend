// Links built from backend strings. Only absolute http(s), mailto: and tel:
// URLs are allowed; javascript:, data:, relative and malformed values are dropped.
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;
const PHONE = /^\+?[\d\s().-]{3,}$/;

export function toSafeHref(
  value: string | undefined,
  allowed: readonly string[] = ALLOWED_PROTOCOLS
): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!allowed.includes(url.protocol)) return null;
  if (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    (!/^https?:\/\//i.test(raw) || !url.hostname || url.username || url.password)
  )
    return null;
  if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
    let contact: string;
    try {
      contact = decodeURIComponent(url.pathname);
    } catch {
      return null;
    }
    if (url.search || url.hash || /[\u0000-\u001f\u007f]/.test(contact)) return null;
    if (url.protocol === 'mailto:' && !EMAIL.test(contact)) return null;
    if (url.protocol === 'tel:' && (!PHONE.test(contact) || contact.replace(/\D/g, '').length < 3))
      return null;
  }
  return url.href;
}

export const isExternalHref = (href: string) => /^https?:/i.test(href);

export type ApplyLinkKind = 'link' | 'email' | 'phone';
export interface ApplyLink {
  kind: ApplyLinkKind;
  href: string;
  // Text shown for email and phone links; the web link uses a fixed label.
  text: string;
  external: boolean;
}

function emailHref(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^mailto:/i.test(raw)) return toSafeHref(raw, ['mailto:']);
  return EMAIL.test(raw) ? toSafeHref(`mailto:${raw}`, ['mailto:']) : null;
}

function phoneHref(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^tel:/i.test(raw)) return toSafeHref(raw, ['tel:']);
  return PHONE.test(raw) ? toSafeHref(`tel:${raw.replace(/[\s().-]/g, '')}`, ['tel:']) : null;
}

// Apply link, email and phone, in that order, without duplicates.
export function getApplyLinks(details: {
  applyLink?: string;
  applyEmail?: string;
  applyPhone?: string;
}): ApplyLink[] {
  const links: ApplyLink[] = [];
  const add = (kind: ApplyLinkKind, href: string | null, text: string) => {
    if (href && !links.some((link) => link.href === href)) {
      links.push({ kind, href, text, external: isExternalHref(href) });
    }
  };
  const web = toSafeHref(details.applyLink);
  add('link', web, details.applyLink?.trim() ?? '');
  add(
    'email',
    emailHref(details.applyEmail),
    details.applyEmail?.trim().replace(/^mailto:/i, '') ?? ''
  );
  add(
    'phone',
    phoneHref(details.applyPhone),
    details.applyPhone?.trim().replace(/^tel:/i, '') ?? ''
  );
  return links;
}
