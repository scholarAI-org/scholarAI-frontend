import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('src/app/[locale]/page.tsx');
const landingFiles = fs
  .readdirSync(path.join(root, 'src/features/landing/components'))
  .map((file) => read(path.join('src/features/landing/components', file)))
  .join('\n');
const messages = `${read('src/messages/ar.json')}\n${read('src/messages/en.json')}`;

test('locale root renders only public landing sections', () => {
  assert.match(page, /export default function LandingPage/);
  assert.doesNotMatch(page, /RoleGuard|admin\/scholarships\/review/);
});

test('landing source has no stale Figma branding, temporary assets, or placeholder links', () => {
  assert.doesNotMatch(
    `${landingFiles}\n${messages}`,
    /accio|figma\.com\/api\/mcp\/asset|href="#"/i
  );
});

test('hero search navigates to student discovery with a search param and makes no API calls', () => {
  const hero = read('src/features/landing/components/Hero.tsx');
  const discovery = read('src/features/landing/components/LandingDiscovery.tsx');
  assert.match(discovery, /from '@\/i18n\/navigation'/);
  assert.match(discovery, /\/student\/scholarships\?search=\$\{encodeURIComponent\(query\)\}/);
  assert.doesNotMatch(`${hero}\n${discovery}`, /apiClient|fetch\(|action="#/);
});

test('contact form reports honestly that no contact endpoint exists', () => {
  const contact = read('src/features/landing/components/ContactSection.tsx');
  assert.match(contact, /t\('unavailable'\)/);
  assert.match(contact, /event\.preventDefault\(\)/);
  assert.doesNotMatch(contact, /fetch\(|apiClient|setTimeout/);
});

test('FAQ exposes matching accordion control and panel identifiers', () => {
  const faq = read('src/features/landing/components/Faq.tsx');
  assert.match(faq, /aria-controls=\{`faq-panel-\$\{i\}`\}/);
  assert.match(faq, /id=\{`faq-panel-\$\{i\}`\}/);
  assert.match(faq, /aria-expanded/);
});

test('Arabic and English landing translations include the contact availability notice', () => {
  const ar = JSON.parse(read('src/messages/ar.json'));
  const en = JSON.parse(read('src/messages/en.json'));
  for (const messages of [ar, en]) {
    assert.ok(messages.Landing.updated.contact.unavailable);
    assert.ok(messages.Landing.updated.hero.placeholder);
  }
});
