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

test('hero search and contact form are explicitly unavailable and do not submit', () => {
  const hero = read('src/features/landing/components/Hero.tsx');
  const contact = read('src/features/landing/components/ContactSection.tsx');
  assert.match(hero, /searchUnavailable/);
  assert.match(hero, /disabled/);
  assert.doesNotMatch(hero, /apiClient|router\.push|fetch\(/);
  assert.match(contact, /contact-unavailable/);
  assert.doesNotMatch(contact, /useState|onSubmit|fetch\(|setTimeout/);
});

test('FAQ exposes matching accordion control and panel identifiers', () => {
  const faq = read('src/features/landing/components/Faq.tsx');
  assert.match(faq, /aria-controls=\{`faq-panel-\$\{i\}`\}/);
  assert.match(faq, /id=\{`faq-panel-\$\{i\}`\}/);
  assert.match(faq, /aria-expanded/);
});

test('Arabic and English landing translations include availability notices', () => {
  const ar = JSON.parse(read('src/messages/ar.json'));
  const en = JSON.parse(read('src/messages/en.json'));
  for (const messages of [ar, en]) {
    assert.ok(messages.Landing.hero.searchUnavailable);
    assert.ok(messages.Landing.contact.unavailable);
    assert.ok(messages.Landing.nav.home);
  }
});
