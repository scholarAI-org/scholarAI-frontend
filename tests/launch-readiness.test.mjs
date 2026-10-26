import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

// Resolve the `@/` path alias used by app code to `src/`.
const root = fileURLToPath(new URL('../', import.meta.url));
const srcPath = path.join(root, 'src');
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

const load = (file) => loadModule(path.join(root, file));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const messages = Object.fromEntries(
  ['ar', 'en'].map((locale) => [locale, JSON.parse(read(`src/messages/${locale}.json`))])
);

const { routing } = load('src/i18n/routing.ts');
const { resolveSiteUrl, absoluteUrl, DEFAULT_SITE_URL } = load('src/lib/site-url.ts');
const { localePath, localeAlternates, OG_IMAGE } = load('src/lib/metadata.ts');
const { PUBLIC_ROUTES, PRIVATE_AREAS, noindexHeaders } = load('src/lib/site-routes.ts');
const { matchLocale } = load('src/i18n/negotiate.ts');
const robots = load('src/app/robots.ts').default;
const sitemap = load('src/app/sitemap.ts').default;
const manifest = load('src/app/manifest.ts').default;

// --- site URL ---------------------------------------------------------------

test('the site URL prefers SITE_URL, then the Vercel URLs, then localhost', () => {
  assert.equal(resolveSiteUrl({}), DEFAULT_SITE_URL);
  assert.equal(resolveSiteUrl({ VERCEL_URL: 'preview.vercel.app' }), 'https://preview.vercel.app');
  assert.equal(
    resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'app.vercel.app', VERCEL_URL: 'preview.app' }),
    'https://app.vercel.app'
  );
  assert.equal(
    resolveSiteUrl({ SITE_URL: 'https://scholarai.ps', VERCEL_URL: 'preview.app' }),
    'https://scholarai.ps'
  );
});

test('the site URL is normalised to an origin and survives bad values', () => {
  assert.equal(resolveSiteUrl({ SITE_URL: 'https://scholarai.ps/' }), 'https://scholarai.ps');
  assert.equal(
    resolveSiteUrl({ SITE_URL: 'https://scholarai.ps/app?a=1' }),
    'https://scholarai.ps'
  );
  assert.equal(resolveSiteUrl({ SITE_URL: 'scholarai.ps' }), 'https://scholarai.ps');
  assert.equal(resolveSiteUrl({ SITE_URL: '   ' }), DEFAULT_SITE_URL);
  assert.equal(resolveSiteUrl({ SITE_URL: 'not a url' }), DEFAULT_SITE_URL);
  assert.equal(absoluteUrl('/ar/login', { SITE_URL: 'https://x.ps' }), 'https://x.ps/ar/login');
  assert.equal(absoluteUrl('/', { SITE_URL: 'https://x.ps' }), 'https://x.ps');
});

// --- canonical and hreflang --------------------------------------------------

test('every locale path keeps its prefix and drops the trailing slash', () => {
  assert.equal(localePath('ar'), '/ar');
  assert.equal(localePath('ar', '/'), '/ar');
  assert.equal(localePath('en', '/login'), '/en/login');
  assert.equal(localePath('en', '/login/'), '/en/login');
});

test('alternates declare a canonical plus one hreflang per locale and an x-default', () => {
  const alternates = localeAlternates('en', '/login');
  assert.equal(alternates.canonical, '/en/login');
  assert.deepEqual(Object.keys(alternates.languages).sort(), ['ar', 'en', 'x-default']);
  assert.equal(alternates.languages.ar, '/ar/login');
  assert.equal(alternates.languages.en, '/en/login');
  // An unmatched visitor gets the routing default.
  assert.equal(alternates.languages['x-default'], localePath(routing.defaultLocale, '/login'));

  // The two locales of a page point at the same set, as search engines require.
  assert.deepEqual(localeAlternates('ar', '/login').languages, alternates.languages);
});

test('the Open Graph image is a real asset with the dimensions it declares', () => {
  const file = path.join(root, 'public', OG_IMAGE.url.replace(/^\//, ''));
  assert.ok(fs.existsSync(file), `${OG_IMAGE.url} exists`);
  // PNG header: width and height are big-endian 32-bit at offsets 16 and 20.
  const header = fs.readFileSync(file).subarray(0, 24);
  assert.equal(header.readUInt32BE(16), OG_IMAGE.width);
  assert.equal(header.readUInt32BE(20), OG_IMAGE.height);
});

// --- robots ------------------------------------------------------------------

test('robots.txt allows the public pages and disallows every signed-in area', () => {
  const { rules, sitemap: sitemapUrl, host } = robots();
  const [rule] = rules;

  assert.equal(rule.userAgent, '*');
  assert.equal(rule.allow, '/');
  for (const locale of routing.locales) {
    for (const area of PRIVATE_AREAS) {
      assert.ok(rule.disallow.includes(`/${locale}${area}`), `${locale}${area} is disallowed`);
    }
  }
  assert.ok(rule.disallow.includes('/backend/'), 'the API proxy is disallowed');
  // No public route may be swept up by a prefix rule.
  for (const route of PUBLIC_ROUTES) {
    for (const locale of routing.locales) {
      const url = localePath(locale, route);
      assert.equal(
        rule.disallow.some((disallowed) => url.startsWith(disallowed)),
        false,
        `${url} stays crawlable`
      );
    }
  }
  assert.match(sitemapUrl, /^https?:\/\/[^/]+\/sitemap\.xml$/);
  assert.match(host, /^https?:\/\/[^/]+$/);
});

// --- sitemap -----------------------------------------------------------------

test('the sitemap lists every public localized URL once, with its alternates', () => {
  const entries = sitemap();
  assert.equal(entries.length, routing.locales.length * PUBLIC_ROUTES.length);
  assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length);

  for (const locale of routing.locales) {
    for (const route of PUBLIC_ROUTES) {
      const entry = entries.find((item) => item.url === absoluteUrl(localePath(locale, route)));
      assert.ok(entry, `${locale} ${route} is listed`);
      assert.deepEqual(Object.keys(entry.alternates.languages).sort(), [...routing.locales].sort());
    }
  }
});

test('the sitemap advertises only routes that exist, and no private or token page', () => {
  for (const route of PUBLIC_ROUTES) {
    const segment = route === '/' ? '' : route;
    assert.ok(
      fs.existsSync(path.join(srcPath, `app/[locale]${segment}/page.tsx`)),
      `${route} has a page`
    );
  }
  const urls = sitemap().map((entry) => entry.url);
  for (const forbidden of ['/student', '/admin', '/reset-password', '/verify-email']) {
    assert.equal(
      urls.some((url) => url.includes(forbidden)),
      false,
      `${forbidden} is not in the sitemap`
    );
  }
});

// --- noindex headers ---------------------------------------------------------

test('both signed-in areas are served noindex, prefixed and unprefixed', () => {
  const headers = noindexHeaders();
  const sources = headers.map((entry) => entry.source);

  for (const area of PRIVATE_AREAS) {
    for (const source of [area, `${area}/:path*`]) {
      assert.ok(sources.includes(source), `${source} is covered`);
    }
    for (const locale of routing.locales) {
      assert.ok(sources.includes(`/${locale}${area}`), `/${locale}${area} is covered`);
      assert.ok(sources.includes(`/${locale}${area}/:path*`), `/${locale}${area}/* is covered`);
    }
  }
  for (const entry of headers) {
    assert.deepEqual(entry.headers, [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]);
  }
  // No public route may pick the header up.
  for (const locale of routing.locales) {
    for (const route of PUBLIC_ROUTES) {
      assert.equal(sources.includes(localePath(locale, route)), false, `${route} stays indexable`);
    }
  }
});

// --- icons and manifest ------------------------------------------------------

test('every app icon exists at the size it claims', () => {
  const expected = [
    ['src/app/icon.png', 32],
    ['src/app/apple-icon.png', 180],
    ['public/icon-192.png', 192],
    ['public/icon-512.png', 512],
  ];
  for (const [file, size] of expected) {
    const header = fs.readFileSync(path.join(root, file)).subarray(0, 24);
    assert.equal(header.readUInt32BE(16), size, `${file} width`);
    assert.equal(header.readUInt32BE(20), size, `${file} height`);
  }

  // favicon.ico: 6-byte header, then one 16-byte entry per image.
  const ico = fs.readFileSync(path.join(root, 'src/app/favicon.ico'));
  assert.equal(ico.readUInt16LE(2), 1, 'is an icon, not a cursor');
  const count = ico.readUInt16LE(4);
  assert.ok(count >= 2, 'carries more than one size');
  const sizes = Array.from({ length: count }, (_, i) => ico.readUInt8(6 + i * 16));
  assert.deepEqual(sizes, [16, 32, 48]);
});

test('the manifest points at icons that exist', () => {
  const { icons, start_url: startUrl } = manifest();
  assert.ok(icons.length > 0);
  for (const icon of icons) {
    assert.ok(fs.existsSync(path.join(root, 'public', icon.src.replace(/^\//, ''))), icon.src);
  }
  assert.equal(startUrl, `/${routing.defaultLocale}`);
});

// --- messages ----------------------------------------------------------------

test('metadata, 404 and error copy exists in both locales with the same shape', () => {
  const shape = (node) =>
    typeof node === 'string'
      ? 'string'
      : Object.fromEntries(Object.entries(node).map(([key, value]) => [key, shape(value)]));

  for (const namespace of ['Metadata', 'NotFound', 'ErrorState']) {
    assert.ok(messages.ar[namespace], `ar has ${namespace}`);
    assert.deepEqual(
      shape(messages.en[namespace]),
      shape(messages.ar[namespace]),
      `${namespace} has the same keys in both locales`
    );
  }

  for (const locale of routing.locales) {
    const metadata = messages[locale].Metadata;
    assert.match(metadata.titleTemplate, /%s/, `${locale} title template has a slot`);
    assert.ok(metadata.description.length > 40, `${locale} description is a real sentence`);
    for (const page of Object.values(metadata.pages)) {
      assert.ok(page.title.trim(), 'page title');
      assert.ok(page.description.trim(), 'page description');
    }
  }
});

test('the metadata description claims nothing the app does not do', () => {
  // Same bar as the landing page: no match scores, no AI document help, no
  // invented numbers (see tests/landing-no-fake-content.test.mjs).
  const banned = [/match score/i, /\d{3,}/, /نسبة توافق/, /تحسين (الوثائق|المستندات)/i];
  for (const locale of routing.locales) {
    const texts = JSON.stringify(messages[locale].Metadata);
    for (const pattern of banned) {
      assert.doesNotMatch(texts, pattern, `${locale} metadata: ${pattern}`);
    }
  }
});

// --- the 404 and error routes -----------------------------------------------

test('the locale 404 and error pages are localized and offer a way out', () => {
  const notFound = read('src/app/[locale]/not-found.tsx');
  assert.match(notFound, /getTranslations\('NotFound'\)/);
  assert.match(notFound, /from '@\/i18n\/navigation'/, 'links home with a locale-aware Link');
  assert.match(notFound, /t\('home'\)/);

  const error = read('src/app/[locale]/error.tsx');
  assert.match(error, /^'use client';/);
  assert.match(error, /useTranslations\('ErrorState'\)/);
  assert.match(error, /onClick=\{reset\}/, 'the retry button resets the boundary');
  assert.match(error, /t\('home'\)/);

  // The root fallbacks must not depend on anything the failure took down.
  const globalError = read('src/app/global-error.tsx');
  assert.match(globalError, /<html/);
  assert.match(globalError, /onClick=\{reset\}/);
  assert.doesNotMatch(globalError, /next-intl|globals\.css/, 'no provider or stylesheet');
});

test('the root 404 negotiates its language, since it renders without a locale', () => {
  assert.equal(matchLocale('en-US,en;q=0.9'), 'en');
  assert.equal(matchLocale('ar-PS,ar;q=0.9,en;q=0.8'), 'ar');
  // Quality values decide, not the order they are written in.
  assert.equal(matchLocale('ar;q=0.2,en;q=0.9'), 'en');
  assert.equal(matchLocale('en'), 'en');
  // Anything unknown, empty or wildcard falls back to the routing default.
  for (const header of [null, undefined, '', '*', 'de-DE,de;q=0.9', 'en;q=0']) {
    assert.equal(matchLocale(header), routing.defaultLocale, String(header));
  }

  const source = read('src/app/not-found.tsx');
  assert.match(source, /matchLocale/);
  assert.match(source, /accept-language/);
  // The root layout's document direction is fixed, so the card sets its own.
  assert.match(source, /dir=\{dir\}/);
});

test('unknown paths inside a locale reach the localized 404, not the root one', () => {
  const catchAll = read('src/app/[locale]/[...rest]/page.tsx');
  assert.match(catchAll, /\bnotFound\(\)/);
  assert.doesNotMatch(catchAll, /return\s*\(/, 'renders nothing of its own');
});

test('a feature flag that is off still lands on the localized 404 page', () => {
  // The gates call notFound(); Next renders the nearest not-found boundary,
  // which is the localized page above. Both halves must stay in place.
  assert.ok(fs.existsSync(path.join(srcPath, 'app/[locale]/not-found.tsx')));
  for (const route of ['student', 'student/saved', 'student/tracking']) {
    // Comments in these files mention notFound() before the call itself.
    const source = read(`src/app/[locale]/${route}/page.tsx`).replace(/^\s*\/\/.*$/gm, '');
    const gate = source.indexOf('featureFlags.');
    const call = source.indexOf('notFound()');
    assert.ok(gate > -1 && call > gate, `${route} gates on a flag before rendering`);
  }
});
