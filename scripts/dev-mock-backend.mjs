#!/usr/bin/env node
// Dev-only mock backend for Feature 006 (Student Saved Scholarships) and the
// 005 discovery/details paths. Serves the TARGET contract for /api/scholarships/saved
// plus a >20-item discovery dataset so pagination can be exercised locally.
//
// Not imported by application code. Lives under scripts/ so the production
// import guard (tests/student-saved-scholarships.test.mjs) can enforce that
// src/ never references it.
//
// See scripts/dev-mock-backend.README.md for how to run and switch scenarios.

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, '..', 'tests', 'fixtures', 'saved-scholarships');

const port = Number(process.env.PORT ?? 4100);
const bootScenario = process.env.SCENARIO ?? 'populated';

const SCENARIOS = new Set([
  'populated',
  'empty',
  'one-item',
  'multi-item',
  'unsave-failure',
  'loading-slow',
  'auth-401',
  'forbidden-403',
  'server-500',
  'malformed',
  'nullable-fields',
]);

const loadFixture = (name) =>
  JSON.parse(readFileSync(path.join(FIXTURES, `${name}.json`), 'utf8'));

// In-process saved collection seeded from the active scenario.
let activeScenario = SCENARIOS.has(bootScenario) ? bootScenario : 'populated';
let saved = seedSaved(activeScenario);

function seedSaved(scenario) {
  switch (scenario) {
    case 'empty':
      return loadFixture('empty');
    case 'one-item':
      return loadFixture('one-item');
    case 'multi-item':
      return loadFixture('multi-item');
    case 'nullable-fields':
      return loadFixture('nullable-fields');
    default:
      return loadFixture('populated');
  }
}

// A >20-item discovery dataset so T043-style multi-page UI can be exercised.
const DISCOVERY = Array.from({ length: 23 }, (_, i) => ({
  id: 1000 + i,
  title: `Discovery scholarship ${i + 1}`,
  title_en: `Discovery scholarship ${i + 1}`,
  title_ar: `منحة اكتشاف ${i + 1}`,
  organization_name: 'Example Org',
  university_name: `University ${(i % 5) + 1}`,
  country: ['Germany', 'France', 'Spain', 'United States', 'United Kingdom'][i % 5],
  study_level: ['bachelor', 'master', 'phd'][i % 3],
  funding_type: i % 2 === 0 ? 'full' : 'partial',
  opportunity_type: 'scholarship',
  image_url: null,
  deadline: `2027-0${(i % 9) + 1}-15`,
  no_deadline: false,
  is_saved: saved.some((s) => s.id === 1000 + i),
}));

function send(res, status, body, extraHeaders = {}) {
  const payload = body == null ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-headers': 'content-type, authorization, cookie',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    ...extraHeaders,
  });
  res.end(payload);
}

function pickScenario(url) {
  const q = url.searchParams.get('scenario');
  if (q && SCENARIOS.has(q)) return q;
  return activeScenario;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const scenario = pickScenario(url);

  if (req.method === 'OPTIONS') return send(res, 204, null);

  // ---- Admin endpoint to switch scenarios without restart --------------
  if (req.method === 'POST' && url.pathname === '/__scenario') {
    const body = (await readBody(req)) ?? {};
    if (typeof body.scenario !== 'string' || !SCENARIOS.has(body.scenario)) {
      return send(res, 400, { detail: 'Unknown scenario' });
    }
    activeScenario = body.scenario;
    saved = seedSaved(activeScenario);
    return send(res, 200, { scenario: activeScenario });
  }

  // ---- Saved list ------------------------------------------------------
  if (req.method === 'GET' && url.pathname === '/api/scholarships/saved') {
    if (scenario === 'auth-401') return send(res, 401, { detail: 'Not authenticated' });
    if (scenario === 'forbidden-403') return send(res, 403, { detail: 'Forbidden' });
    if (scenario === 'server-500') return send(res, 500, { detail: 'Internal error' });
    if (scenario === 'malformed')
      return send(res, 200, loadFixture('malformed'));
    if (scenario === 'loading-slow') {
      await new Promise((r) => setTimeout(r, 3000));
    }
    return send(res, 200, saved);
  }

  // ---- Discovery -------------------------------------------------------
  if (req.method === 'GET' && url.pathname === '/api/scholarships/') {
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('page_size') ?? 20)));
    const start = (page - 1) * pageSize;
    const items = DISCOVERY.slice(start, start + pageSize).map((item) => ({
      ...item,
      is_saved: saved.some((s) => s.id === item.id),
    }));
    return send(res, 200, {
      items,
      total: DISCOVERY.length,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(DISCOVERY.length / pageSize),
    });
  }

  // ---- Details ---------------------------------------------------------
  const detailMatch = url.pathname.match(/^\/api\/scholarships\/(\d+)$/);
  if (req.method === 'GET' && detailMatch) {
    const id = Number(detailMatch[1]);
    const card = DISCOVERY.find((s) => s.id === id) ?? saved.find((s) => s.id === id);
    if (!card) return send(res, 404, { detail: 'Not found' });
    return send(res, 200, {
      ...card,
      ingestion_type: 'manual',
      source: 'Mock',
      source_url: null,
      description_html: null,
      funding_amount: '$10,000',
      language_requirements: 'English (B2)',
      majors: ['Any'],
      eligibility_criteria: ['Open to international students'],
      required_documents: ['Transcript', 'CV'],
      apply_link: 'https://example.org/apply',
      apply_email: null,
      apply_phone: null,
      pdf_url: null,
      attachments: null,
      is_extension: false,
      published_at: '2026-09-01',
      is_saved: saved.some((s) => s.id === id),
    });
  }

  // ---- Save / Unsave ---------------------------------------------------
  const saveMatch = url.pathname.match(/^\/api\/scholarships\/(\d+)\/save$/);
  if (saveMatch) {
    const id = Number(saveMatch[1]);
    if (req.method === 'POST') {
      if (!saved.some((s) => s.id === id)) {
        const card =
          DISCOVERY.find((s) => s.id === id) ?? { id, title: `Scholarship ${id}`, is_saved: true };
        saved = [...saved, { ...card, is_saved: true }];
      }
      return send(res, 200, {
        id: id + 50000,
        user_id: 1,
        scholarship_id: id,
        created_at: new Date().toISOString(),
        is_saved: true,
        message: 'ok',
      });
    }
    if (req.method === 'DELETE') {
      if (scenario === 'unsave-failure') return send(res, 500, { detail: 'Unsave failed' });
      saved = saved.filter((s) => s.id !== id);
      return send(res, 200, { scholarship_id: id, is_saved: false, message: 'ok' });
    }
  }

  // ---- Current user (satisfies the existing session check) -------------
  if (req.method === 'GET' && url.pathname === '/api/me/current') {
    if (scenario === 'auth-401') return send(res, 401, { detail: 'Not authenticated' });
    return send(res, 200, {
      id: 1,
      email: 'student@example.org',
      role: 'student',
      is_active: true,
      first_name: 'Test',
      last_name: 'Student',
    });
  }

  send(res, 404, { detail: 'Not found' });
});

server.listen(port, () => {
  console.log(`[dev-mock-backend] listening on http://127.0.0.1:${port}  scenario=${activeScenario}`);
  console.log(`[dev-mock-backend] switch:  curl -XPOST http://127.0.0.1:${port}/__scenario -H content-type:application/json -d '{"scenario":"empty"}'`);
});
