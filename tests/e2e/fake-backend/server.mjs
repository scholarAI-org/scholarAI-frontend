// Standalone fake of the ScholarAI backend, for the Playwright smoke tests only.
// Nothing under src/ may import this file. Start it with `node server.mjs` (PORT, default 4010).
//
// Shapes follow docs/api/openapi.json and the live schema at
// https://scholarai-tpxy.onrender.com/openapi.json (checked 2026-10-28). Where the live
// schema is ahead of the committed one (PUT/GET /api/scholarships/{id}/tracking) the app
// does not call it yet, so it is not faked.
//
// State is per user: every test seeds its own user through /__e2e/users, so tests never
// share rows and can run in parallel. /__e2e/* is not part of the real API.

import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 4010);
const SESSION_COOKIE = 'scholarai_session';
const VALID_OTP = '123456';

// ---------------------------------------------------------------- catalog

const WORDS = [
  'Aurora',
  'Borealis',
  'Cedar',
  'Delta',
  'Ember',
  'Falcon',
  'Glacier',
  'Harbor',
  'Ivory',
  'Juniper',
  'Kestrel',
  'Lagoon',
  'Meridian',
  'Nimbus',
  'Orchid',
  'Pinnacle',
  'Quartz',
  'Raven',
  'Summit',
  'Tundra',
  'Umbra',
  'Vertex',
  'Willow',
  'Xenon',
  'Yarrow',
  'Zephyr',
];
const COUNTRIES = ['Germany', 'Turkey', 'Malaysia', 'United Kingdom', 'Canada'];
const LEVELS = [['bachelor'], ['master'], ['phd'], ['master', 'phd'], ['postdoc']];
const FUNDING = ['full', 'partial'];
const OPPORTUNITIES = ['scholarship', 'fellowship', 'grant', 'exchange', 'short_course'];

function dateInDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// 26 published scholarships, ids 1..26 (two pages at the app's page size of 20).
// Every 7th has no deadline; ids 1-6 and 8 are due within 30 days, the rest later.
const CATALOG = WORDS.map((word, index) => {
  const id = index + 1;
  const noDeadline = id % 7 === 0;
  return {
    id,
    title: `${word} Scholarship`,
    title_ar: `منحة ${word}`,
    title_en: `${word} Scholarship`,
    slug: `${word.toLowerCase()}-scholarship`,
    organization_name: `${word} Foundation`,
    university_name: `University of ${COUNTRIES[index % COUNTRIES.length]}`,
    country: COUNTRIES[index % COUNTRIES.length],
    study_level: LEVELS[index % LEVELS.length],
    funding_type: FUNDING[index % FUNDING.length],
    opportunity_type: OPPORTUNITIES[index % OPPORTUNITIES.length],
    image_url: null,
    deadline: noDeadline ? null : dateInDays(id <= 8 ? id * 3 : 40 + id),
    no_deadline: noDeadline,
  };
});

const findScholarship = (id) => CATALOG.find((s) => s.id === id);

// ---------------------------------------------------------------- state

const users = new Map(); // email (lowercase) -> user
const sessions = new Map(); // token -> email
const requestLog = [];
let nextUserId = 1000;
let nextTrackingId = 5000;

const STATUSES = [
  'preparing_documents',
  'ready_to_apply',
  'applied',
  'accepted',
  'rejected',
  'closed',
];

function emptyPersonalInfo() {
  return null; // a new account has no profile row yet: GET /profile answers 404
}

function createUser({ name, email, password, role = 'student', verified = true }) {
  const user = {
    id: nextUserId++,
    name,
    email: email.toLowerCase(),
    password,
    role,
    verified,
    otp: VALID_OTP,
    personal: emptyPersonalInfo(),
    completion: 0,
    saved: [], // [{ scholarship_id, id, created_at }] newest first
    tracked: [], // tracking rows
  };
  users.set(user.email, user);
  return user;
}

const now = () => new Date().toISOString();

function toCard(scholarship, user) {
  return { ...scholarship, is_saved: user.saved.some((s) => s.scholarship_id === scholarship.id) };
}

function trackedRow(user, { scholarship_id, status = 'preparing_documents', notes = null }) {
  const stamp = now();
  const row = {
    id: nextTrackingId++,
    user_id: user.id,
    scholarship_id,
    status,
    notes,
    status_changed_at: stamp,
    created_at: stamp,
    updated_at: stamp,
  };
  user.tracked.push(row);
  return row;
}

function trackedResponse(user, row) {
  const { user_id: _userId, scholarship_id: scholarshipId, ...rest } = row;
  return { ...rest, scholarship: toCard(findScholarship(scholarshipId), user) };
}

// ---------------------------------------------------------------- http helpers

function send(res, status, body, headers = {}) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(payload);
}

const unauthorized = (res) => send(res, 401, { detail: 'Not authenticated' });
const notFound = (res, detail = 'Not found') => send(res, 404, { detail });
const invalid = (res, field, msg) =>
  send(res, 422, { detail: [{ loc: ['body', field], msg, type: 'value_error' }] });

function collect(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

// req.raw is set once per request by the server handler.
function readBody(req) {
  if (!req.raw) return { ok: true, value: undefined };
  try {
    return { ok: true, value: JSON.parse(req.raw) };
  } catch {
    return { ok: false };
  }
}

function sessionToken(req) {
  const header = req.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=');
  }
  return null;
}

function sessionUser(req) {
  const token = sessionToken(req);
  const email = token ? sessions.get(token) : undefined;
  return email ? users.get(email) : undefined;
}

const cookieHeader = (value, maxAge) =>
  `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;

// ---------------------------------------------------------------- discovery

function parseDiscovery(searchParams) {
  const list = (name) => searchParams.getAll(name).filter(Boolean);
  return {
    search: (searchParams.get('search') ?? '').trim().toLowerCase(),
    levels: [...list('academic_level'), ...list('study_level')],
    funding: list('funding_type'),
    opportunity: list('opportunity_type'),
    countries: list('country'),
    sort: searchParams.get('sort') ?? 'newest',
    page: Math.max(1, Number(searchParams.get('page') ?? 1) || 1),
    pageSize: Math.min(100, Math.max(1, Number(searchParams.get('page_size') ?? 20) || 20)),
  };
}

function discover(user, searchParams) {
  const q = parseDiscovery(searchParams);
  let items = CATALOG.filter((s) => {
    if (q.search) {
      const haystack = [
        s.title,
        s.title_ar,
        s.title_en,
        s.organization_name,
        s.university_name,
        s.country,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q.search)) return false;
    }
    if (q.levels.length && !s.study_level.some((l) => q.levels.includes(l))) return false;
    if (q.funding.length && !q.funding.includes(s.funding_type)) return false;
    if (q.opportunity.length && !q.opportunity.includes(s.opportunity_type)) return false;
    if (q.countries.length && !q.countries.includes(s.country)) return false;
    return true;
  });
  if (q.sort === 'deadline_soon' || q.sort === 'deadline_soonest') {
    items = [...items].sort((a, b) => {
      if (!a.deadline && !b.deadline) return b.id - a.id;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline) || b.id - a.id;
    });
  } else {
    items = [...items].sort((a, b) => b.id - a.id); // newest first
  }
  const total = items.length;
  const start = (q.page - 1) * q.pageSize;
  return {
    items: items.slice(start, start + q.pageSize).map((s) => toCard(s, user)),
    total,
    page: q.page,
    page_size: q.pageSize,
    total_pages: Math.ceil(total / q.pageSize),
  };
}

// ---------------------------------------------------------------- profile

function profileResponse(user) {
  return {
    id: user.id,
    user_id: user.id,
    personal_info: user.personal,
    academic_info: null,
    documents: null,
    skills_and_languages: { languages: [], skills: [] },
    experiences: [],
    has_experience: null,
    preferences: null,
    avatar_url: null,
    profile_completion_percentage: user.completion,
  };
}

const PERSONAL_REQUIRED = [
  'full_name_ar',
  'full_name_en',
  'email',
  'birth_date',
  'gender',
  'nationality',
  'country_of_residence',
];
const PERSONAL_ALLOWED = new Set([
  ...PERSONAL_REQUIRED,
  'phone_number',
  'city',
  'financial_status',
  'id_number',
  'passport_number',
]);

function normalizePersonal(body) {
  return {
    phone_number: null,
    city: null,
    financial_status: null,
    id_number: null,
    passport_number: null,
    ...body,
  };
}

// ---------------------------------------------------------------- routes

async function route(req, res, url, user) {
  const { pathname, searchParams } = url;
  const method = req.method ?? 'GET';
  let match;

  if (pathname === '/health' && method === 'GET') return send(res, 200, { status: 'ok' });

  // ----- control API (tests only) -----
  if (pathname.startsWith('/__e2e/')) return control(req, res, url, method);

  // ----- auth -----
  if (pathname === '/auth/register' && method === 'POST') {
    const body = readBody(req);
    if (!body.ok || typeof body.value !== 'object' || body.value === null) {
      return send(res, 422, {
        detail: [{ loc: ['body'], msg: 'Invalid JSON', type: 'json_invalid' }],
      });
    }
    const { full_name: name, email, password, ...extra } = body.value;
    if (Object.keys(extra).length)
      return invalid(res, Object.keys(extra)[0], 'Extra inputs are not permitted');
    if (typeof name !== 'string' || !name) return invalid(res, 'full_name', 'Field required');
    if (typeof email !== 'string' || !email.includes('@'))
      return invalid(res, 'email', 'Invalid email');
    if (typeof password !== 'string' || password.length < 8)
      return invalid(res, 'password', 'Password too short');
    if (users.has(email.toLowerCase()))
      return send(res, 400, { detail: 'Email already registered' });
    createUser({ name, email, password, verified: false });
    return send(res, 201, { message: 'Registered. Check your email for the verification code.' });
  }

  if (pathname === '/auth/verify-email' && method === 'POST') {
    const body = readBody(req);
    const target =
      body.ok && body.value ? users.get(String(body.value.email ?? '').toLowerCase()) : undefined;
    if (!target || String(body.value.otp) !== target.otp) {
      return send(res, 400, { detail: 'Invalid or expired verification code' });
    }
    target.verified = true;
    return send(res, 200, { message: 'Email verified' });
  }

  if (pathname === '/auth/login' && method === 'POST') {
    const body = readBody(req);
    const value = body.ok ? body.value : undefined;
    if (!value || typeof value.email !== 'string' || typeof value.password !== 'string') {
      return send(res, 422, {
        detail: [{ loc: ['body'], msg: 'Field required', type: 'missing' }],
      });
    }
    const target = users.get(value.email.toLowerCase());
    if (!target || target.password !== value.password) {
      return send(res, 401, { detail: 'Invalid email or password' });
    }
    if (!target.verified) return send(res, 403, { detail: 'Email is not verified' });
    const token = randomBytes(24).toString('hex');
    sessions.set(token, target.email);
    return send(res, 200, { role: target.role }, { 'Set-Cookie': cookieHeader(token, 3600) });
  }

  if (pathname === '/auth/logout' && method === 'POST') {
    const token = sessionToken(req);
    if (token) sessions.delete(token);
    return send(res, 200, { message: 'Logged out' }, { 'Set-Cookie': cookieHeader('', 0) });
  }

  // Everything below needs a session.
  if (!user) return unauthorized(res);

  if (pathname === '/auth/me' && method === 'GET') {
    return send(res, 200, { id: user.id, email: user.email, name: user.name, role: user.role });
  }

  // ----- profile -----
  if (pathname === '/profile' && method === 'GET') {
    return user.personal
      ? send(res, 200, profileResponse(user))
      : notFound(res, 'Profile not found');
  }
  if (pathname === '/profile/personal-info' && method === 'PUT') {
    const body = readBody(req);
    if (!body.ok || typeof body.value !== 'object' || body.value === null)
      return invalid(res, 'body', 'Invalid JSON');
    for (const field of PERSONAL_REQUIRED) {
      if (typeof body.value[field] !== 'string' || !body.value[field])
        return invalid(res, field, 'Field required');
    }
    const extra = Object.keys(body.value).find((key) => !PERSONAL_ALLOWED.has(key));
    if (extra) return invalid(res, extra, 'Extra inputs are not permitted');
    user.personal = normalizePersonal(body.value);
    return send(res, 200, user.personal);
  }
  if (pathname === '/profile/documents' && method === 'GET') return send(res, 200, {});
  if (pathname === '/profile/experiences' && method === 'GET') return send(res, 200, []);
  if (pathname === '/profile/skills-and-languages' && method === 'GET') {
    return send(res, 200, { languages: [], skills: [] });
  }

  // ----- scholarships -----
  if (pathname === '/api/scholarships/' && method === 'GET')
    return send(res, 200, discover(user, searchParams));

  if (pathname === '/api/scholarships/filter-options' && method === 'GET') {
    return send(res, 200, { countries: [...new Set(CATALOG.map((s) => s.country))].sort() });
  }

  if (pathname === '/api/scholarships/saved' && method === 'GET') {
    return send(
      res,
      200,
      user.saved.map((entry) => toCard(findScholarship(entry.scholarship_id), user))
    );
  }

  if (pathname === '/api/scholarships/tracked' && method === 'GET') {
    return send(
      res,
      200,
      user.tracked.map((row) => trackedResponse(user, row))
    );
  }

  if ((match = pathname.match(/^\/api\/scholarships\/tracked\/(\d+)(\/status|\/note)?$/))) {
    const row = user.tracked.find((r) => r.id === Number(match[1]));
    if (!row) return notFound(res, 'Tracked application not found');
    const suffix = match[2];

    if (!suffix && method === 'DELETE') {
      user.tracked = user.tracked.filter((r) => r !== row);
      return send(res, 200, {
        scholarship_id: row.scholarship_id,
        is_tracked: false,
        is_saved: user.saved.some((s) => s.scholarship_id === row.scholarship_id),
      });
    }
    if (suffix === '/status' && method === 'PATCH') {
      const body = readBody(req);
      const status = body.ok ? body.value?.status : undefined;
      if (!STATUSES.includes(status)) return invalid(res, 'status', 'Invalid status');
      if (status !== row.status) {
        row.status = status;
        row.status_changed_at = now();
      }
      row.updated_at = now();
      return send(res, 200, { ...row });
    }
    if (suffix === '/note' && method === 'PUT') {
      const body = readBody(req);
      const notes = body.ok ? body.value?.notes : undefined;
      if (notes !== null && typeof notes !== 'string') return invalid(res, 'notes', 'Invalid note');
      row.notes = notes === '' ? null : notes;
      row.updated_at = now();
      return send(res, 200, { ...row });
    }
  }

  if ((match = pathname.match(/^\/api\/scholarships\/(\d+)\/save$/))) {
    const id = Number(match[1]);
    if (!findScholarship(id)) return notFound(res, 'Scholarship not found');
    const existing = user.saved.find((s) => s.scholarship_id === id);
    if (method === 'POST') {
      const entry = existing ?? { id: nextTrackingId++, scholarship_id: id, created_at: now() };
      if (!existing) user.saved.unshift(entry);
      return send(res, 200, {
        id: entry.id,
        user_id: user.id,
        scholarship_id: id,
        created_at: entry.created_at,
        is_saved: true,
        message: 'Scholarship saved',
      });
    }
    if (method === 'DELETE') {
      user.saved = user.saved.filter((s) => s.scholarship_id !== id);
      return send(res, 200, {
        scholarship_id: id,
        is_saved: false,
        message: 'Scholarship removed',
      });
    }
  }

  return notFound(res, `No fake route for ${method} ${pathname}`);
}

// ---------------------------------------------------------------- control API

async function control(req, res, url, method) {
  const { pathname, searchParams } = url;

  // Seed one verified user. Body: { email, name?, password?, personal?, completion?, saved?: number[],
  // tracked?: [{ scholarship_id, status?, notes? }] }
  if (pathname === '/__e2e/users' && method === 'POST') {
    const body = readBody(req).value ?? {};
    const email = String(body.email ?? `user-${randomBytes(4).toString('hex')}@e2e.test`);
    if (users.has(email.toLowerCase())) return send(res, 409, { detail: 'User exists' });
    const user = createUser({
      name: body.name ?? 'E2E Student',
      email,
      password: body.password ?? 'Passw0rd!',
      role: body.role ?? 'student',
    });
    user.personal = body.personal ? normalizePersonal(body.personal) : null;
    user.completion = body.completion ?? 0;
    for (const id of body.saved ?? []) {
      user.saved.push({ id: nextTrackingId++, scholarship_id: id, created_at: now() });
    }
    for (const entry of body.tracked ?? []) trackedRow(user, entry);
    return send(res, 201, { id: user.id, email: user.email, password: user.password });
  }

  // What the backend holds for a user: lets tests assert on server-side effects.
  if (pathname === '/__e2e/state' && method === 'GET') {
    const target = users.get(String(searchParams.get('email') ?? '').toLowerCase());
    if (!target) return notFound(res, 'No such user');
    return send(res, 200, {
      verified: target.verified,
      personal: target.personal,
      savedIds: target.saved.map((s) => s.scholarship_id),
      tracked: target.tracked.map((r) => ({
        id: r.id,
        scholarship_id: r.scholarship_id,
        status: r.status,
        notes: r.notes,
      })),
    });
  }

  // Requests the backend received for a user (path filter optional), oldest first.
  if (pathname === '/__e2e/requests' && method === 'GET') {
    const email = String(searchParams.get('email') ?? '').toLowerCase();
    const path = searchParams.get('path');
    const entries = requestLog.filter((e) => e.user === email && (!path || e.path === path));
    return send(res, 200, entries);
  }

  if (pathname === '/__e2e/reset' && method === 'POST') {
    users.clear();
    sessions.clear();
    requestLog.length = 0;
    return send(res, 200, { ok: true });
  }

  return notFound(res, `No control route for ${method} ${pathname}`);
}

// ---------------------------------------------------------------- server

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://fake-backend');
  const user = sessionUser(req);
  try {
    req.raw = await collect(req);
    if (!url.pathname.startsWith('/__e2e/') && url.pathname !== '/health') {
      res.on('finish', () => {
        const body = readBody(req);
        const email = user?.email ?? String(body.value?.email ?? '').toLowerCase();
        requestLog.push({
          at: now(),
          user: email,
          method: req.method,
          path: url.pathname,
          query: Object.fromEntries(url.searchParams),
          status: res.statusCode,
          body: body.ok ? body.value : req.raw,
        });
        if (requestLog.length > 2000) requestLog.shift();
      });
    }
    await route(req, res, url, user);
  } catch (error) {
    console.error('[fake-backend] unhandled', error);
    if (!res.headersSent) send(res, 500, { detail: 'Fake backend error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[fake-backend] listening on http://127.0.0.1:${PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
