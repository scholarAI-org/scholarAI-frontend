import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
 * Looks a UI string up in the app's own message files ('Namespace.path.to.key'), so the
 * tests follow copy changes instead of hard-coding English and Arabic text. Only plain
 * {placeholder} values are filled in; ICU plurals are not supported.
 */
export function t(locale: Locale, key: string, params: Record<string, string | number> = {}) {
  let node: string | Tree | undefined = load(locale);
  for (const part of key.split('.')) {
    node = typeof node === 'object' ? node[part] : undefined;
  }
  if (typeof node !== 'string') throw new Error(`No ${locale} message for "${key}"`);
  return node.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}
