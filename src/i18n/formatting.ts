import type { Formats } from 'next-intl';

// Arabic UI uses Latin digits everywhere, on server and client, whatever the
// runtime's CLDR default for `ar` is. Routing keeps the plain `ar`/`en` locale.
export const NUMBERING_SYSTEM = 'latn';

// Locale tag for direct Intl.* and IntlMessageFormat calls.
export const toFormattingLocale = (locale: string) => `${locale}-u-nu-${NUMBERING_SYSTEM}`;

// next-intl formats `#` with the plain locale, so messages use
// `{count, number, integer}` instead to get the pinned numbering system.
export const intlFormats = {
  number: {
    integer: { numberingSystem: NUMBERING_SYSTEM, maximumFractionDigits: 0 },
  },
  dateTime: {
    short: { dateStyle: 'short', numberingSystem: NUMBERING_SYSTEM },
    medium: { dateStyle: 'medium', numberingSystem: NUMBERING_SYSTEM },
  },
} satisfies Formats;
