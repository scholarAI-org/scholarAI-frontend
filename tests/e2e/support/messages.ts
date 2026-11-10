import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { IntlMessageFormat } from 'intl-messageformat';
import { intlFormats, toFormattingLocale } from '../../../src/i18n/formatting';

export type Locale = 'en' | 'ar';
export const LOCALES: Locale[] = ['en', 'ar'];

type Tree = { [key: string]: string | Tree };
const cache = new Map<Locale, Tree>();

function load(locale: Locale): Tree {
  let tree = cache.get(locale);
  if (!tree) {
    const file = fileURLToPath(new URL(`../../../src/messages/${locale}.json`, import.meta.url));
    tree = JSON.parse(readFileSync(file, 'utf8')) as Tree;
    cache.set(locale, tree);
  }
  return tree;
}

/**
 * Looks a UI string up in the app's own message files ('Namespace.path.to.key') and formats
 * it the way the app does (ICU plurals, Latin digits in Arabic), so the tests follow copy
 * changes instead of hard-coding English and Arabic text.
 */
export function t(locale: Locale, key: string, params: Record<string, string | number> = {}) {
  let node: string | Tree | undefined = load(locale);
  for (const part of key.split('.')) {
    node = typeof node === 'object' ? node[part] : undefined;
  }
  if (typeof node !== 'string') throw new Error(`No ${locale} message for "${key}"`);
  return String(
    new IntlMessageFormat(node, toFormattingLocale(locale), intlFormats).format(params)
  );
}
