import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);

loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

loadModule.extensions['.tsx'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  module._compile(outputText, filename);
};

const srcPath = fileURLToPath(new URL('../src', import.meta.url));
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.BACKEND_URL = 'https://backend.test/';
// Default-off: never set SAVED_SCHOLARSHIPS_ENABLED at module top level.

// -------------------- Phase 1: flag + guards -------------------------------

test('T003 flag default: unset means false', () => {
  const prev = process.env.SAVED_SCHOLARSHIPS_ENABLED;
  delete process.env.SAVED_SCHOLARSHIPS_ENABLED;
  try {
    const { featureFlags } = loadModule(path.join(srcPath, 'lib/feature-flags.ts'));
    assert.equal(featureFlags.savedScholarshipsEnabled, false);
  } finally {
    if (prev === undefined) delete process.env.SAVED_SCHOLARSHIPS_ENABLED;
    else process.env.SAVED_SCHOLARSHIPS_ENABLED = prev;
  }
});

test('T003 flag non-"true" values stay false', () => {
  const prev = process.env.SAVED_SCHOLARSHIPS_ENABLED;
  const { featureFlags } = loadModule(path.join(srcPath, 'lib/feature-flags.ts'));
  try {
    for (const value of ['', 'false', '0', '1', 'yes', 'TRUE', ' true ', 'True']) {
      process.env.SAVED_SCHOLARSHIPS_ENABLED = value;
      assert.equal(featureFlags.savedScholarshipsEnabled, false, `value=${JSON.stringify(value)}`);
    }
  } finally {
    if (prev === undefined) delete process.env.SAVED_SCHOLARSHIPS_ENABLED;
    else process.env.SAVED_SCHOLARSHIPS_ENABLED = prev;
  }
});

test('T003 flag only the literal "true" enables it', () => {
  const prev = process.env.SAVED_SCHOLARSHIPS_ENABLED;
  const { featureFlags } = loadModule(path.join(srcPath, 'lib/feature-flags.ts'));
  try {
    process.env.SAVED_SCHOLARSHIPS_ENABLED = 'true';
    assert.equal(featureFlags.savedScholarshipsEnabled, true);
  } finally {
    if (prev === undefined) delete process.env.SAVED_SCHOLARSHIPS_ENABLED;
    else process.env.SAVED_SCHOLARSHIPS_ENABLED = prev;
  }
});

test('T003 static scan: no NEXT_PUBLIC_ prefix, no default-true pattern', () => {
  const flagSrc = fs.readFileSync(path.join(srcPath, 'lib/feature-flags.ts'), 'utf8');
  const envExample = fs.readFileSync(
    path.join(srcPath, '..', '.env.example'),
    'utf8'
  );
  // In feature-flags.ts the saved flag must not read a NEXT_PUBLIC_ variable
  // and must not fall back to true.
  const flagRelevant = flagSrc
    .split('\n')
    .filter((line) => /saved/i.test(line) || /SAVED_SCHOLARSHIPS/.test(line))
    .join('\n');
  assert.doesNotMatch(flagRelevant, /NEXT_PUBLIC_/, 'feature-flags.ts must not expose the saved flag via NEXT_PUBLIC_');
  assert.doesNotMatch(flagRelevant, /\|\|\s*true\b/, 'feature-flags.ts must not fall back to true');
  assert.doesNotMatch(flagRelevant, /=\s*true\b/, 'feature-flags.ts must not default the saved flag to true');
  // In .env.example the SAVED_SCHOLARSHIPS_ENABLED entry must not be prefixed
  // NEXT_PUBLIC_ and must not default to "true".
  assert.doesNotMatch(envExample, /NEXT_PUBLIC_SAVED_SCHOLARSHIPS_ENABLED/);
  assert.doesNotMatch(envExample, /^SAVED_SCHOLARSHIPS_ENABLED\s*=\s*true/m);
});

// -------------------- T006 production-import guard -------------------------

const PROD_FORBIDDEN = /(^|\/)(tests|scripts|fixtures)\//;
const RELATIVE_FORBIDDEN = /^(?:\.\.\/)+(tests|scripts|fixtures)\//;

function walkFiles(root) {
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function extractSpecifiers(source) {
  const specs = [];
  const re = /(?:from|import)\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(source)) !== null) specs.push(m[1]);
  return specs;
}

test('T006 no file under src/ imports from tests/, scripts/, or any *fixture* path', () => {
  const files = walkFiles(srcPath);
  const violations = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const spec of extractSpecifiers(src)) {
      if (RELATIVE_FORBIDDEN.test(spec) || PROD_FORBIDDEN.test(spec) || /\.fixture(\.|$)/.test(spec)) {
        violations.push(`${path.relative(srcPath, file)}: ${spec}`);
      }
    }
  }
  assert.deepEqual(violations, [], `src/ must not import from tests/scripts/fixtures:\n${violations.join('\n')}`);
});

test('T006 saved-empty asset is local and no figma.com / temporary CDN reference leaks into src/', () => {
  const emptyComponent = fs.readFileSync(
    path.join(srcPath, 'features/student/saved-scholarships/components/SavedScholarshipsEmpty.tsx'),
    'utf8'
  );
  // Phase 1–3: inline SVG placeholder OR a local /images/*.svg reference is
  // acceptable. Phase 7 T038 switches this to the exported local asset.
  const hasInlineSvg = /<svg[^>]*data-testid="saved-empty-illustration"/.test(emptyComponent);
  const hasLocalImgRef = /src="\/images\/[^"']+\.svg"/.test(emptyComponent);
  assert.ok(
    hasInlineSvg || hasLocalImgRef,
    'saved-empty asset must be an inline SVG or a /images/*.svg reference'
  );
  const files = walkFiles(srcPath);
  const bannedHostRe = /\b(figma\.com|localhost:3845|s3\.amazonaws\.com\/figma|api\.figma\.com)\b/;
  const offenders = [];
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    if (bannedHostRe.test(src)) offenders.push(path.relative(srcPath, file));
  }
  assert.deepEqual(offenders, [], `No src/ file may reference temporary Figma / CDN URLs:\n${offenders.join('\n')}`);
});

// -------------------- T006a reuse-boundary -----------------------------------

test('T006a saved-scholarships does not re-export ScholarshipDiscoveryCard or redefine toScholarshipCard', () => {
  const subFeatureRoot = path.join(srcPath, 'features/student/saved-scholarships');
  const files = walkFiles(subFeatureRoot);
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(
      src,
      /export\s+(?:type\s+)?{[^}]*\bScholarshipDiscoveryCard\b[^}]*}/,
      `${path.relative(srcPath, file)}: must not re-export ScholarshipDiscoveryCard`
    );
    assert.doesNotMatch(
      src,
      /\bfunction\s+toScholarshipCard\b/,
      `${path.relative(srcPath, file)}: must not redefine toScholarshipCard`
    );
    assert.doesNotMatch(
      src,
      /\bconst\s+toScholarshipCard\s*=/,
      `${path.relative(srcPath, file)}: must not redefine toScholarshipCard`
    );
  }
});

test('T006a saved-scholarships introduces no new bookmark mutation hook', () => {
  const subFeatureRoot = path.join(srcPath, 'features/student/saved-scholarships');
  const files = walkFiles(subFeatureRoot);
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    // Forbid redefining the existing bookmark-mutation hook name.
    assert.doesNotMatch(
      src,
      /\bfunction\s+useScholarshipBookmark\b/,
      `${path.relative(srcPath, file)}: must not redefine useScholarshipBookmark`
    );
    assert.doesNotMatch(
      src,
      /\bconst\s+useScholarshipBookmark\s*=/,
      `${path.relative(srcPath, file)}: must not redefine useScholarshipBookmark`
    );
    // No parallel mutation hook named like a save/unsave mutation.
    assert.doesNotMatch(
      src,
      /\b(?:function|const)\s+use(Saved|Unsave|Bookmark)Mutation\b/,
      `${path.relative(srcPath, file)}: no parallel save/unsave mutation hook allowed`
    );
  }
});

// -------------------- T034 i18n keys ---------------------------------------

test('T034 nav.saved and StudentSavedScholarships namespace exist in ar/en', () => {
  for (const locale of ['ar', 'en']) {
    const data = JSON.parse(fs.readFileSync(path.join(srcPath, `messages/${locale}.json`), 'utf8'));
    assert.ok(data.StudentLayout?.nav?.saved, `${locale}: StudentLayout.nav.saved missing`);
    const sav = data.StudentSavedScholarships;
    assert.ok(sav, `${locale}: StudentSavedScholarships namespace missing`);
    for (const key of ['title', 'count', 'loading', 'empty', 'errors', 'unsave']) {
      assert.ok(sav[key], `${locale}: StudentSavedScholarships.${key} missing`);
    }
    for (const key of ['heading', 'body', 'cta']) {
      assert.ok(sav.empty[key], `${locale}: StudentSavedScholarships.empty.${key} missing`);
    }
    for (const key of ['generic', 'unauthorized', 'forbidden', 'retry']) {
      assert.ok(sav.errors[key], `${locale}: StudentSavedScholarships.errors.${key} missing`);
    }
    assert.ok(sav.unsave.failed, `${locale}: StudentSavedScholarships.unsave.failed missing`);
  }
});

test('T034 saved nav labels are "Saved" (en) and "المحفوظات" (ar)', () => {
  const en = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/en.json'), 'utf8'));
  const ar = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/ar.json'), 'utf8'));
  assert.equal(en.StudentLayout.nav.saved, 'Saved');
  assert.equal(ar.StudentLayout.nav.saved, 'المحفوظات');
});

test('T034 403 copy stays generic (no "account disabled" phrasing)', () => {
  for (const locale of ['ar', 'en']) {
    const data = JSON.parse(fs.readFileSync(path.join(srcPath, `messages/${locale}.json`), 'utf8'));
    const forbidden = data.StudentSavedScholarships.errors.forbidden;
    assert.doesNotMatch(forbidden, /account disabled/i, `${locale}: forbidden copy must not say "account disabled"`);
    assert.doesNotMatch(forbidden, /الحساب\s*(معطل|موقوف|محظور)/, `${locale}: forbidden copy must not imply account disabled`);
  }
});

// -------------------- T012 server-component gate (flag OFF ⇒ notFound) -----

test('T012 saved page Server Component gates on the flag before any fetch', () => {
  // Source-level invariants: the page reads featureFlags.savedScholarshipsEnabled,
  // calls notFound() when it is off, and does not call apiClient directly.
  const source = fs.readFileSync(
    path.join(srcPath, 'app/[locale]/student/saved/page.tsx'),
    'utf8'
  );
  assert.match(source, /from 'next\/navigation'/);
  assert.match(source, /\bnotFound\(\)/);
  assert.match(source, /featureFlags\.savedScholarshipsEnabled/);
  assert.match(
    source,
    /if\s*\(\s*!\s*featureFlags\.savedScholarshipsEnabled\s*\)[^{]*{\s*notFound\(\)/,
    'notFound() must run BEFORE anything else in the component body'
  );
  assert.doesNotMatch(source, /apiClient\s*\(/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});

// -------------------- Phase 2: validator (T008) + API (T011) ---------------

const {
  validateSavedResponse,
  SavedContractError,
} = loadModule(
  path.join(srcPath, 'features/student/saved-scholarships/lib/validateSavedResponse.ts')
);

const populated = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('./fixtures/saved-scholarships/populated.json', import.meta.url)), 'utf8')
);
const emptyFixture = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('./fixtures/saved-scholarships/empty.json', import.meta.url)), 'utf8')
);
const oneItem = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('./fixtures/saved-scholarships/one-item.json', import.meta.url)), 'utf8')
);
const multiItem = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('./fixtures/saved-scholarships/multi-item.json', import.meta.url)), 'utf8')
);
const nullableFields = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('./fixtures/saved-scholarships/nullable-fields.json', import.meta.url)), 'utf8')
);
const malformedFixture = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('./fixtures/saved-scholarships/malformed.json', import.meta.url)), 'utf8')
);

test('T008 validator accepts populated / one-item / multi-item / nullable-fields', () => {
  for (const fx of [populated, oneItem, multiItem, nullableFields]) {
    const result = validateSavedResponse(fx);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.cards.length, fx.length);
  }
});

test('T008 validator empty [] is ok:true with zero cards', () => {
  const result = validateSavedResponse(emptyFixture);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.cards.length, 0);
});

test('T008 validator rejects non-array envelope with not-array reason', () => {
  const result = validateSavedResponse(malformedFixture);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.reason, 'not-array');
});

test('T008 validator rejects missing is_saved with missing-is-saved reason', () => {
  const result = validateSavedResponse([{ id: 1, title: 'x' }]);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.reason, 'missing-is-saved');
    assert.equal(result.error.itemIndex, 0);
  }
});

test('T008 validator rejects non-boolean is_saved as missing-is-saved', () => {
  const result = validateSavedResponse([{ id: 1, title: 'x', is_saved: 'yes' }]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.reason, 'missing-is-saved');
});

test('T008 validator rejects bad id/title as empty-item-shape', () => {
  const result = validateSavedResponse([{ id: 'nope', title: 'x', is_saved: true }]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.reason, 'empty-item-shape');
});

test('T008 validator rejects is_saved=false with is-saved-false reason', () => {
  const result = validateSavedResponse([{ id: 1, title: 'x', is_saved: false }]);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.reason, 'is-saved-false');
});

test('T008 SavedContractError carries typed reason and index', () => {
  const err = new SavedContractError('empty-item-shape', 3);
  assert.equal(err.reason, 'empty-item-shape');
  assert.equal(err.itemIndex, 3);
  assert.ok(err instanceof Error);
});

// -- API call ---------------------------------------------------------------

const { getSavedScholarships } = loadModule(
  path.join(srcPath, 'features/student/saved-scholarships/api/saved-scholarships.ts')
);

const realFetch = globalThis.fetch;
let calls = [];
const mockFetch = (body, status = 200) => {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: new URL(url), init });
    return new Response(status === 204 ? null : JSON.stringify(body), { status });
  };
};
afterEach(() => {
  globalThis.fetch = realFetch;
});

test('T011 getSavedScholarships GETs /api/scholarships/saved with no query args', async () => {
  mockFetch(populated);
  const controller = new AbortController();
  const cards = await getSavedScholarships(controller.signal);
  assert.equal(cards.length, populated.length);
  const [{ url, init }] = calls;
  assert.equal(init.method, undefined);
  assert.equal(init.signal, controller.signal);
  assert.equal(init.credentials, 'include');
  assert.equal(url.origin + url.pathname, 'https://backend.test/api/scholarships/saved');
  for (const forbidden of ['page', 'page_size', 'skip', 'limit']) {
    assert.equal(url.searchParams.get(forbidden), null, `must not send ${forbidden}`);
  }
});

test('T011 malformed response throws SavedContractError, does not resolve as empty', async () => {
  mockFetch(malformedFixture);
  await assert.rejects(() => getSavedScholarships(), SavedContractError);
});

test('T011 is_saved=false in an item throws SavedContractError (never silently rendered)', async () => {
  mockFetch([{ id: 1, title: 'x', is_saved: false }]);
  await assert.rejects(() => getSavedScholarships(), (err) => err instanceof SavedContractError && err.reason === 'is-saved-false');
});

// -------------------- Phase 3: state rendering (T020) ----------------------

test('T020 page states: loading, populated, confirmed empty, error — each renders the right content', () => {
  const React = loadModule('react');
  const { renderToStaticMarkup } = loadModule('react-dom/server');
  const { QueryClient, QueryClientProvider } = loadModule('@tanstack/react-query');
  const originalLoad = Module._load;

  let locale = 'en';
  let messages = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/en.json'), 'utf8'));

  // Canned hook state the SavedScholarshipsPage reads instead of running React Query.
  let injected = { isLoading: true, isError: false, data: undefined, error: null };
  const hookPath = path.join(
    srcPath,
    'features/student/saved-scholarships/hooks/useSavedScholarshipsQuery.ts'
  );
  const resolvedHook = loadModule.resolve(hookPath);

  Module._load = function (request, parent, ...rest) {
    if (request === '@/i18n/navigation')
      return { Link: ({ children, ...props }) => React.createElement('a', props, children) };
    if (request === 'next-intl')
      return {
        useLocale: () => locale,
        useTranslations: (namespace) => (key, values) => {
          const message = (namespace + '.' + key)
            .split('.')
            .reduce((value, part) => (value ? value[part] : undefined), messages);
          if (message === undefined || message === null) return `${namespace}.${key}`;
          return new IntlMessageFormat(message, locale).format(values);
        },
      };
    // Intercept both the alias form and the relative form by resolving.
    try {
      const resolved = originalLoad.call(this, request, parent, ...rest);
      // falls through
      return resolved === undefined ? undefined : resolved;
    } finally {
      /* no-op */
    }
  };

  // Replace cache of the hook module so SavedScholarshipsPage picks up our stub.
  loadModule.cache[resolvedHook] = {
    exports: {
      useSavedScholarshipsQuery: () => ({
        ...injected,
        refetch: () => Promise.resolve(injected),
      }),
    },
  };

  try {
    const { SavedScholarshipsPage } = loadModule(
      path.join(srcPath, 'features/student/saved-scholarships/components/SavedScholarshipsPage.tsx')
    );

    function render() {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const markup = renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(SavedScholarshipsPage)
        )
      );
      client.clear();
      return markup;
    }

    function renderWith(state) {
      injected = { isLoading: false, isError: false, data: undefined, error: null, ...state };
      return render();
    }

    // --- Loading (no cached data, no error): skeletons visible, no empty copy.
    const loading = renderWith({ isLoading: true });
    assert.match(loading, /saved-loading/);
    assert.doesNotMatch(loading, />0 saved/i, 'count must not be zero while loading');
    assert.doesNotMatch(loading, new RegExp(messages.StudentSavedScholarships.empty.heading));

    // --- Populated: grid renders cards; count equals cards.length.
    const populatedMarkup = renderWith({ data: populated });
    assert.match(populatedMarkup, /saved-grid/);
    for (const item of populated) {
      assert.ok(
        populatedMarkup.includes(item.title_en) || populatedMarkup.includes(item.title),
        `populated markup should include ${item.title}`
      );
    }
    assert.match(populatedMarkup, new RegExp(`${populated.length} saved scholarships`));
    // No match badge/score/label on any saved card (FR-019).
    assert.doesNotMatch(populatedMarkup, /match[- ]?badge|match[- ]?score|aria-label="[^"]*match/i);
    assert.doesNotMatch(populatedMarkup, /\d+%\s*match/i);
    // Details link resolves to /{locale}/student/scholarships/{id} with the real id (FR-011).
    for (const item of populated) {
      assert.ok(
        new RegExp(`/(en|ar)/student/scholarships/${item.id}\\b`).test(populatedMarkup) ||
          new RegExp(`/student/scholarships/${item.id}\\b`).test(populatedMarkup),
        `Details link for id ${item.id} must point at /student/scholarships/${item.id}`
      );
    }

    // --- Confirmed empty: illustration + CTA to /student/scholarships.
    const empty = renderWith({ data: [] });
    assert.match(empty, /saved-empty-illustration/);
    assert.match(empty, /saved-empty-cta/);
    assert.ok(empty.includes(messages.StudentSavedScholarships.empty.heading));
    assert.match(empty, /href="[^"]*\/student\/scholarships"/);
    // Count line reads zero (confirmed), not "unknown".
    assert.match(empty, /No saved scholarships/);

    // --- Generic error: retryable error state, no empty substitution.
    const genericErr = new Error('boom');
    const generic = renderWith({ isError: true, error: genericErr });
    assert.match(generic, /saved-error/);
    assert.match(generic, /saved-error-retry/);
    assert.doesNotMatch(generic, /saved-empty-illustration/);
    assert.ok(generic.includes(messages.StudentSavedScholarships.errors.generic));

    // --- SavedContractError: same error state, generic copy, no backend-contract leak.
    const contractErr = new SavedContractError('empty-item-shape', 2);
    const contract = renderWith({ isError: true, error: contractErr });
    assert.match(contract, /saved-error/);
    assert.doesNotMatch(contract, /saved-empty-illustration/);
    assert.doesNotMatch(contract, /empty-item-shape|not-array|missing-is-saved|is-saved-false/);
    assert.doesNotMatch(contract, /contract/i);

    // --- 401: generic retryable; the existing auth flow handles the redirect.
    const { ApiError } = loadModule(path.join(srcPath, 'lib/api-client.ts'));
    const err401 = new ApiError('Not authenticated', [], 401);
    const auth = renderWith({ isError: true, error: err401 });
    assert.match(auth, /saved-error/);
    assert.ok(auth.includes(messages.StudentSavedScholarships.errors.unauthorized));

    // --- 403: generic access-unavailable copy, no Retry (no auto-retry), no "account disabled".
    const err403 = new ApiError('Forbidden', [], 403);
    const forbidden = renderWith({ isError: true, error: err403 });
    assert.match(forbidden, /saved-error/);
    assert.ok(forbidden.includes(messages.StudentSavedScholarships.errors.forbidden));
    assert.doesNotMatch(forbidden, /saved-error-retry/);
    assert.doesNotMatch(forbidden, /account disabled/i);

    // --- Arabic parity: title + nav label render in Arabic.
    locale = 'ar';
    messages = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/ar.json'), 'utf8'));
    const arEmpty = renderWith({ data: [] });
    assert.ok(arEmpty.includes(messages.StudentSavedScholarships.empty.heading));
    assert.ok(arEmpty.includes(messages.StudentSavedScholarships.empty.cta));
  } finally {
    Module._load = originalLoad;
  }
});

// -------------------- Phase 5: Navigation Plumbing (T032, T033) -------------

const {
  studentNavigation,
  withSavedEnabled,
  getVisibleStudentNavigation,
  getStudentNavigationSections,
  isStudentNavigationItemActive,
  getStudentPageKey,
} = loadModule(path.join(srcPath, 'features/student/layout/student-navigation.ts'));

test('T032 nav + flag: savedEnabled=false emits no saved item in nav sections', () => {
  const items = withSavedEnabled(studentNavigation, false);
  const visible = getVisibleStudentNavigation(items);
  assert.equal(visible.some((item) => item.id === 'saved'), false);

  const sections = getStudentNavigationSections(items);
  const discoverSection = sections.find((sec) => sec.id === 'discover');
  assert.ok(discoverSection, 'discover section should exist');
  assert.equal(discoverSection.items.some((item) => item.id === 'saved'), false);
});

test('T032 nav + flag: savedEnabled=true includes saved item under discover group', () => {
  const items = withSavedEnabled(studentNavigation, true);
  const visible = getVisibleStudentNavigation(items);
  assert.equal(visible.some((item) => item.id === 'saved'), true);

  const sections = getStudentNavigationSections(items);
  const discoverSection = sections.find((sec) => sec.id === 'discover');
  assert.ok(discoverSection, 'discover section should exist');
  assert.equal(discoverSection.items.some((item) => item.id === 'saved'), true);
  assert.equal(discoverSection.items.find((item) => item.id === 'saved').href, '/student/saved');
});

test('T033 single-active-nav guarantee: exactly one item active per route', () => {
  const items = withSavedEnabled(studentNavigation, true);
  const routes = [
    { path: '/student/profile', activeId: 'profile' },
    { path: '/student/scholarships', activeId: 'scholarships' },
    { path: '/student/scholarships/123', activeId: 'scholarships' },
    { path: '/student/saved', activeId: 'saved' },
  ];

  for (const { path: pathname, activeId } of routes) {
    const activeItems = items.filter((item) => isStudentNavigationItemActive(item, pathname));
    assert.equal(
      activeItems.length,
      1,
      `Expected exactly 1 active nav item for ${pathname}, got ${activeItems.length}`
    );
    assert.equal(
      activeItems[0].id,
      activeId,
      `Expected active nav item for ${pathname} to be "${activeId}", got "${activeItems[0].id}"`
    );
  }

  // Explicit assertions: /student/scholarships* NEVER activates saved, and /student/saved NEVER activates scholarships
  const scholarshipsActiveForSaved = isStudentNavigationItemActive(
    items.find((i) => i.id === 'scholarships'),
    '/student/saved'
  );
  assert.equal(scholarshipsActiveForSaved, false, '/student/saved must not activate scholarships nav item');

  const savedActiveForScholarships = isStudentNavigationItemActive(
    items.find((i) => i.id === 'saved'),
    '/student/scholarships'
  );
  assert.equal(savedActiveForScholarships, false, '/student/scholarships must not activate saved nav item');

  const savedActiveForDetails = isStudentNavigationItemActive(
    items.find((i) => i.id === 'saved'),
    '/student/scholarships/123'
  );
  assert.equal(savedActiveForDetails, false, '/student/scholarships/123 must not activate saved nav item');

  assert.equal(getStudentPageKey('/student/saved'), 'saved');
});

// -------------------- Phase 6: i18n & Plurals (T036, T037) -----------------

function flattenObjectKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) =>
    typeof child === 'string' ? [[`${prefix}${key}`, child]] : flattenObjectKeys(child, `${prefix}${key}.`)
  );
}

test('T036 namespace key-parity: StudentSavedScholarships and nav.saved exist in ar and en with identical keys', () => {
  const arData = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/ar.json'), 'utf8'));
  const enData = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/en.json'), 'utf8'));

  assert.ok(arData.StudentLayout?.nav?.saved, 'ar.json missing StudentLayout.nav.saved');
  assert.ok(enData.StudentLayout?.nav?.saved, 'en.json missing StudentLayout.nav.saved');
  assert.equal(arData.StudentLayout.nav.saved, 'المحفوظات');
  assert.equal(enData.StudentLayout.nav.saved, 'Saved');

  const arSaved = arData.StudentSavedScholarships;
  const enSaved = enData.StudentSavedScholarships;
  assert.ok(arSaved, 'ar.json missing StudentSavedScholarships namespace');
  assert.ok(enSaved, 'en.json missing StudentSavedScholarships namespace');

  const arKeys = flattenObjectKeys(arSaved).map(([k]) => k).sort();
  const enKeys = flattenObjectKeys(enSaved).map(([k]) => k).sort();

  assert.deepEqual(arKeys, enKeys, 'StudentSavedScholarships key sets must match between ar and en');
});

test('T037 ICU plural formatting: count formatting across 0, 1, 2, 3, 11, 100 in ar and en with Latin digits', () => {
  const { intlFormats, toFormattingLocale } = loadModule(path.join(srcPath, 'i18n/formatting.ts'));
  const arData = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/ar.json'), 'utf8'));
  const enData = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/en.json'), 'utf8'));

  const arMessage = arData.StudentSavedScholarships.count;
  const enMessage = enData.StudentSavedScholarships.count;

  const arFormatter = new IntlMessageFormat(arMessage, toFormattingLocale('ar'), { number: intlFormats.number });
  const enFormatter = new IntlMessageFormat(enMessage, toFormattingLocale('en'), { number: intlFormats.number });

  // Assert =0 branch is hit at count 0
  assert.equal(arFormatter.format({ count: 0 }), 'لا توجد منح محفوظة');
  assert.equal(enFormatter.format({ count: 0 }), 'No saved scholarships');

  // Arabic plural branches: 1 (one), 2 (two), 3 (few), 11 (many), 100 (other)
  const ar1 = arFormatter.format({ count: 1 });
  const ar2 = arFormatter.format({ count: 2 });
  const ar3 = arFormatter.format({ count: 3 });
  const ar11 = arFormatter.format({ count: 11 });
  const ar100 = arFormatter.format({ count: 100 });

  assert.equal(ar1, 'منحة محفوظة واحدة');
  assert.equal(ar2, 'منحتان محفوظتان');
  assert.equal(ar3, '3 منح محفوظة');
  assert.equal(ar11, '11 منحة محفوظة');
  assert.equal(ar100, '100 منحة محفوظة');

  // English plural branches: 1 (one), 2 (other), 3 (other), 11 (other), 100 (other)
  assert.equal(enFormatter.format({ count: 1 }), '1 saved scholarship');
  assert.equal(enFormatter.format({ count: 2 }), '2 saved scholarships');
  assert.equal(enFormatter.format({ count: 3 }), '3 saved scholarships');

  // Assert Latin digits are rendered (no Arabic-Indic digits ٠-٩)
  const arabicIndicRegex = /[٠-٩۰-۹]/;
  for (const count of [0, 1, 2, 3, 11, 100]) {
    const formattedAr = arFormatter.format({ count });
    const formattedEn = enFormatter.format({ count });
    assert.equal(arabicIndicRegex.test(formattedAr), false, `Count ${count} in ar formatted with Arabic-Indic digits: ${formattedAr}`);
    assert.equal(arabicIndicRegex.test(formattedEn), false, `Count ${count} in en formatted with Arabic-Indic digits: ${formattedEn}`);
  }
});
