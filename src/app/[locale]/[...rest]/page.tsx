import { notFound } from 'next/navigation';

/**
 * Catch-all for unknown paths inside a locale, so they render the localized 404
 * below instead of the root one, which has no locale to read.
 */
export default function NotFoundCatchAll() {
  notFound();
}
