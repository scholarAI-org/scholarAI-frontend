import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

// Invented data that previously shipped on the public landing page (en + ar).
const FAKE_STRINGS = [
  // hero stat cards and acceptance card
  '1241',
  '+250',
  'Fulbright',
  'فولبرايت',
  // stats row
  '+4200',
  '+1500',
  '98%',
  // featured scholarships
  'Chevening',
  'DAAD',
  'Erasmus',
  'MBZUAI',
  'YTB',
  'MEXT',
  'days left',
  'يوم متبق',
  // testimonials
  'Omar Khalil',
  'Sara Hamdan',
  'Ahmad Al-Najjar',
  'عمر خليل',
  'سارة حمدان',
  'أحمد النجار',
  // unverifiable claims
  '12,000',
  '92%',
  'hundreds of',
  'مئات',
  'Saudi Arabia',
  'السعودية',
  'seven days',
  '48 hours',
  '48 ساعة',
];

// Product claims with no backing in the app today: ScholarshipMatchBadge never receives
// match data, the profile "Improve AI" button is disabled ("Coming soon"), and nothing
// compares scholarships. Compared case-insensitively, en + ar.
const UNBACKED_CLAIMS = [
  // match scores
  'match score',
  'ranks opportunities',
  'ranks scholarships',
  'eligibility & matching',
  'see your match',
  'نسبة توافق',
  'يرتب المنح',
  'تقييم الأهلية',
  // side-by-side compare
  'side by side',
  'side-by-side',
  'جنبًا إلى جنب',
  // AI document enhancement
  'document improvement',
  'improve documents',
  'improve your documents',
  'documents with ai',
  'with intelligent assistance',
  'suggestions tailored',
  'ai suggestions',
  'تحسين الوثائق',
  'تحسين المستندات',
  'حسّن مستنداتك',
  'بمساعدة ai',
  'تقنيات الذكاء',
  'اقتراحات مخصصة',
  'تحسينات الذكاء الاصطناعي',
];

// Internal-only destinations that must not be advertised on the public page.
const INTERNAL_LINKS = ['admin dashboard', 'لوحة الإدارة'];

const BANNED = [...FAKE_STRINGS, ...UNBACKED_CLAIMS, ...INTERNAL_LINKS].map((banned) =>
  banned.toLowerCase()
);
const findBanned = (text) => BANNED.find((banned) => text.toLowerCase().includes(banned));

// Walk the import graph from the landing route so only code that can render is checked.
function reachableSources(entry) {
  const seen = new Map();
  const queue = [entry];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    const source = read(file);
    seen.set(file, source);
    for (const [, spec] of source.matchAll(/from '([^']+)'/g)) {
      let target;
      if (spec.startsWith('@/features/landing/')) target = `src/${spec.slice(2)}`;
      else if (spec.startsWith('./')) target = path.posix.join(path.posix.dirname(file), spec);
      else if (spec.startsWith('../')) target = path.posix.join(path.posix.dirname(file), spec);
      else continue;
      const candidate = ['.tsx', '.ts'].map((ext) => target + ext).find((c) => fs.existsSync(c));
      if (candidate) queue.push(candidate);
    }
  }
  return seen;
}

const sources = reachableSources('src/app/[locale]/page.tsx');
const landingSources = [...sources].filter(([file]) => file.startsWith('src/features/landing/'));

function usedNamespaces() {
  const namespaces = new Set();
  for (const [, source] of landingSources) {
    for (const [, ns] of source.matchAll(/useTranslations\('([^']+)'\)/g)) namespaces.add(ns);
  }
  return namespaces;
}

const resolve = (messages, ns) => ns.split('.').reduce((node, key) => node?.[key], messages);
const strings = (node) =>
  typeof node === 'string' ? [node] : node ? Object.values(node).flatMap(strings) : [];

test('rendered landing sources contain no known fake or unbacked strings', () => {
  assert.ok(landingSources.length > 5, 'import graph walk found the landing components');
  for (const [file, source] of landingSources) {
    assert.equal(findBanned(source), undefined, `${file} contains a banned string`);
  }
});

test('rendered landing translations contain no known fake or unbacked strings in ar or en', () => {
  const namespaces = usedNamespaces();
  assert.ok(namespaces.size > 5, 'found the translation namespaces the page renders');
  for (const locale of ['ar', 'en']) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`));
    for (const ns of namespaces) {
      const node = resolve(messages, ns);
      assert.ok(node, `${locale}: namespace ${ns} exists`);
      for (const text of strings(node)) {
        assert.equal(findBanned(text), undefined, `${locale} ${ns}: "${text}"`);
      }
    }
  }
});

test('landing components render no hardcoded numeric literals', () => {
  for (const [file, source] of landingSources) {
    assert.doesNotMatch(source, />\s*[+]?\d[\d,.]*%?\s*</, `${file} renders a literal number`);
  }
});

test('landing has no fake scholarship, statistic or testimonial sections', () => {
  const files = landingSources.map(([file]) => path.posix.basename(file));
  for (const banned of ['FeaturedScholarships', 'ScholarshipCard', 'StatsRow', 'Testimonial']) {
    assert.ok(!files.some((f) => f.includes(banned)), `${banned} is still rendered`);
  }
});

test('landing message files carry no unused Landing namespaces', () => {
  const used = usedNamespaces();
  // Landing.brand is read by the shared Logo outside the landing route.
  const allowed = new Set([...used, 'Landing.brand']);
  for (const locale of ['ar', 'en']) {
    const { Landing } = JSON.parse(read(`src/messages/${locale}.json`));
    const declared = Object.keys(Landing).flatMap((key) =>
      key === 'updated'
        ? Object.keys(Landing.updated).map((sub) => `Landing.updated.${sub}`)
        : [`Landing.${key}`]
    );
    const unused = declared.filter((ns) => !allowed.has(ns));
    assert.deepEqual(unused, [], `${locale} has unused Landing messages`);
  }
});

test('every in-page anchor link on the landing resolves to a rendered section id', () => {
  const all = landingSources.map(([, source]) => source).join('\n');
  const ids = new Set([...all.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]));
  // Hex colors such as '#e2e8f0' are not anchors.
  const targets = [...all.matchAll(/(?:href="|'|")#([\w-]+)/g)]
    .map((m) => m[1])
    .filter((target) => !/^[0-9a-f]{3,8}$/i.test(target));
  assert.ok(targets.length > 0);
  for (const target of targets) {
    assert.ok(ids.has(target), `#${target} has no matching section id`);
  }
});

test('AiFeatures has exactly one icon and one tone per feature card in ar and en', () => {
  const source = read('src/features/landing/components/AiFeatures.tsx');
  const count = (name) => {
    const start = source.indexOf(`const ${name} = [`);
    assert.notEqual(start, -1, `${name} is declared`);
    return source.slice(start, source.indexOf(']', start)).match(/'[^']+'/g).length;
  };
  for (const locale of ['ar', 'en']) {
    const { items } = JSON.parse(read(`src/messages/${locale}.json`)).Landing.updated.features;
    assert.equal(count('ICONS'), items.length, `${locale}: ICONS vs cards`);
    assert.equal(count('TONES'), items.length, `${locale}: TONES vs cards`);
  }
});

// The only real ScholarAI account found in the repo config is the GitHub organisation (the
// `origin` remote). No LinkedIn or other social URL exists anywhere, so none may be linked.
const ALLOWED_EXTERNAL_LINKS = new Set(['https://github.com/scholarAI-org']);

test('external landing links point only to the real ScholarAI GitHub organisation', () => {
  const all = landingSources.map(([, source]) => source).join('\n');
  const external = [...new Set(all.match(/https?:\/\/[^\s'"`<>)]+/g) ?? [])];
  for (const url of external) {
    assert.ok(ALLOWED_EXTERNAL_LINKS.has(url), `${url} is not a known ScholarAI account`);
  }
});

test('the public landing links to no admin route', () => {
  for (const [file, source] of landingSources) {
    assert.doesNotMatch(source, /\/admin\b/, `${file} links to an admin route`);
  }
});
