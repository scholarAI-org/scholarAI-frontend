import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
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

// --- 1. details-link tests ---
test('details-link: getScholarshipDetailsHref(id, enabled) behavior', () => {
  const { getScholarshipDetailsHref } = loadModule(
    path.join(srcPath, 'features/student/scholarship-discovery/lib/details-link.ts')
  );

  // Enabled = false -> returns null
  assert.equal(getScholarshipDetailsHref(7, false), null);
  assert.equal(getScholarshipDetailsHref(1, false), null);

  // Enabled = true + valid id -> returns path
  assert.equal(getScholarshipDetailsHref(7, true), '/student/scholarships/7');
  assert.equal(getScholarshipDetailsHref(100, true), '/student/scholarships/100');

  // Invalid id -> returns null
  assert.equal(getScholarshipDetailsHref(0, true), null);
  assert.equal(getScholarshipDetailsHref(-1, true), null);
  assert.equal(getScholarshipDetailsHref(-7, true), null);
  assert.equal(getScholarshipDetailsHref(NaN, true), null);
  assert.equal(getScholarshipDetailsHref(1.5, true), null);
  assert.equal(getScholarshipDetailsHref(999999999999999999999999, true), null);
});

// --- 2. Route param & feature flag validation ---
test('Route page ([id]/page.tsx) source validation for flag and param rules', () => {
  const pageSrc = fs.readFileSync(
    path.join(srcPath, 'app/[locale]/student/scholarships/[id]/page.tsx'),
    'utf8'
  );
  assert.match(pageSrc, /featureFlags\.scholarshipDetailsEnabled/);
  assert.match(pageSrc, /notFound\(\)/);
  assert.match(pageSrc, /Number\.isSafeInteger/);
});

test('Feature flag OFF -> notFound; ON -> renders route', async () => {
  const prev = process.env.SCHOLARSHIP_DETAILS_ENABLED;
  try {
    delete process.env.SCHOLARSHIP_DETAILS_ENABLED;
    const { featureFlags } = loadModule(path.join(srcPath, 'lib/feature-flags.ts'));
    assert.equal(featureFlags.scholarshipDetailsEnabled, false);

    process.env.SCHOLARSHIP_DETAILS_ENABLED = 'false';
    assert.equal(featureFlags.scholarshipDetailsEnabled, false);

    process.env.SCHOLARSHIP_DETAILS_ENABLED = 'true';
    assert.equal(featureFlags.scholarshipDetailsEnabled, true);
  } finally {
    if (prev === undefined) delete process.env.SCHOLARSHIP_DETAILS_ENABLED;
    else process.env.SCHOLARSHIP_DETAILS_ENABLED = prev;
  }
});

// --- 3. Response contract validation ---
const { validateDetailsResponse } = loadModule(
  path.join(srcPath, 'features/student/scholarship-details/lib/validateDetailsResponse.ts')
);

test('validateDetailsResponse: accepts valid payload with required fields and optional extra fields', () => {
  const validPayload = {
    id: 42,
    title: 'Fulbright Scholarship',
    is_saved: true,
    ingestion_type: 'manual',
    source: 'scholarai',
    university_name: 'Harvard University',
    funding_amount: '$50,000',
    extra_unknown_field: 'allowed',
  };
  const result = validateDetailsResponse(validPayload);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.id, 42);
    assert.equal(result.data.title, 'Fulbright Scholarship');
  }
});

test('validateDetailsResponse: rejects missing required fields and wrong types', () => {
  // Non-object
  assert.equal(validateDetailsResponse(null).ok, false);
  assert.equal(validateDetailsResponse('string').ok, false);

  // Missing or invalid ID
  assert.equal(validateDetailsResponse({ title: 't', is_saved: true, ingestion_type: 'manual', source: 's' }).ok, false);
  assert.equal(validateDetailsResponse({ id: 0, title: 't', is_saved: true, ingestion_type: 'manual', source: 's' }).ok, false);
  assert.equal(validateDetailsResponse({ id: -5, title: 't', is_saved: true, ingestion_type: 'manual', source: 's' }).ok, false);
  assert.equal(validateDetailsResponse({ id: '42', title: 't', is_saved: true, ingestion_type: 'manual', source: 's' }).ok, false);

  // Missing or invalid title
  assert.equal(validateDetailsResponse({ id: 1, is_saved: true, ingestion_type: 'manual', source: 's' }).ok, false);
  assert.equal(validateDetailsResponse({ id: 1, title: 123, is_saved: true, ingestion_type: 'manual', source: 's' }).ok, false);

  // Missing or invalid is_saved
  assert.equal(validateDetailsResponse({ id: 1, title: 't', ingestion_type: 'manual', source: 's' }).ok, false);
  assert.equal(validateDetailsResponse({ id: 1, title: 't', is_saved: 'true', ingestion_type: 'manual', source: 's' }).ok, false);

  // Missing or invalid ingestion_type
  assert.equal(validateDetailsResponse({ id: 1, title: 't', is_saved: true, source: 's' }).ok, false);

  // Missing or invalid source
  assert.equal(validateDetailsResponse({ id: 1, title: 't', is_saved: true, ingestion_type: 'manual' }).ok, false);
});

// --- 4. i18n key parity and ICU rules ---
test('i18n: StudentScholarshipDetails key parity between ar.json and en.json', () => {
  const arData = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/ar.json'), 'utf8'));
  const enData = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/en.json'), 'utf8'));

  assert.ok(arData.StudentScholarshipDetails, 'ar.json missing StudentScholarshipDetails');
  assert.ok(enData.StudentScholarshipDetails, 'en.json missing StudentScholarshipDetails');

  function flattenKeys(obj, prefix = '') {
    return Object.entries(obj).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null ? flattenKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`]
    );
  }

  const arKeys = flattenKeys(arData.StudentScholarshipDetails).sort();
  const enKeys = flattenKeys(enData.StudentScholarshipDetails).sort();

  assert.deepEqual(arKeys, enKeys, 'ar and en key sets must match for StudentScholarshipDetails');
});

test('i18n: no # character in StudentScholarshipDetails ICU strings', () => {
  const arData = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/ar.json'), 'utf8'));
  const detailsJson = JSON.stringify(arData.StudentScholarshipDetails);
  assert.equal(detailsJson.includes('#'), false, 'StudentScholarshipDetails must not contain # character');
});

// --- 5. Single active navigation item ---
test('single-active-nav: /student/scholarships/[id] activates Search item', () => {
  const { isStudentNavigationItemActive, studentNavigation } = loadModule(
    path.join(srcPath, 'features/student/layout/student-navigation.ts')
  );

  const pathname = '/student/scholarships/42';
  const activeItems = studentNavigation.filter((item) =>
    isStudentNavigationItemActive(item, pathname)
  );

  assert.equal(activeItems.length, 1);
  assert.equal(activeItems[0].id, 'scholarships');
});

// --- 6. Page states: 401/403/404/5xx localized states ---
test('ScholarshipDetailsPage handles 401, 403, 404, and 5xx error states', () => {
  const React = loadModule('react');
  const { renderToStaticMarkup } = loadModule('react-dom/server');
  const { QueryClient, QueryClientProvider } = loadModule('@tanstack/react-query');
  const apiClientModule = loadModule(path.join(srcPath, 'lib/api-client.ts'));
  const { ApiError } = apiClientModule;
  const originalLoad = Module._load;

  let locale = 'en';
  let messages = JSON.parse(fs.readFileSync(path.join(srcPath, 'messages/en.json'), 'utf8'));

  let injected = { isLoading: false, isFetching: false, isError: false, data: undefined, error: null };
  const hookPath = path.join(
    srcPath,
    'features/student/scholarship-details/hooks/useScholarshipDetailsQuery.ts'
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
    if (request === '@/lib/api-client' || request.includes('api-client')) return apiClientModule;
    return originalLoad.call(this, request, parent, ...rest);
  };

  loadModule.cache[resolvedHook] = {
    exports: {
      useScholarshipDetailsQuery: () => ({
        ...injected,
        refetch: () => Promise.resolve(injected),
      }),
    },
  };

  try {
    const { ScholarshipDetailsPage } = loadModule(
      path.join(srcPath, 'features/student/scholarship-details/components/ScholarshipDetailsPage.tsx')
    );

    function renderWith(state) {
      injected = { isLoading: false, isError: false, data: undefined, error: null, ...state };
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const markup = renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(ScholarshipDetailsPage, { rawId: '42' })
        )
      );
      client.clear();
      return markup;
    }

    // 404 state
    const html404 = renderWith({ isError: true, error: new ApiError('Not found', [], 404) });
    assert.ok(/Scholarship not found/i.test(html404));

    // 401 state
    const html401 = renderWith({ isError: true, error: new ApiError('Unauthorized', [], 401) });
    assert.ok(/session has ended/i.test(html401));

    // 403 state
    const html403 = renderWith({ isError: true, error: new ApiError('Forbidden', [], 403) });
    assert.ok(/have access to this scholarship/i.test(html403));

    // 5xx / generic error state
    const html500 = renderWith({ isError: true, error: new ApiError('Server error', [], 500) });
    assert.ok(/couldn&#x27;t be loaded|couldn't be loaded/i.test(html500));

    // Valid data
    const validData = {
      id: 42,
      title: 'Chevening Scholarship 2026',
      is_saved: false,
      ingestion_type: 'manual',
      source: 'official',
    };
    const html200 = renderWith({ data: validData });
    assert.ok(html200.includes('Chevening Scholarship 2026'));
  } finally {
    Module._load = originalLoad;
  }
});
