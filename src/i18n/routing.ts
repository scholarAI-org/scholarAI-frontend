import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Runtime is constrained to Arabic-only for now. 'en' stays out of this array
  // (not deleted — src/messages/en.json and every t('key') call are untouched)
  // so re-enabling it later is a one-line change, not a restructure.
  locales: ['ar'],
  defaultLocale: 'ar',
});
