import assert from 'node:assert/strict';
import fs from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, test } from 'node:test';
import { IntlMessageFormat } from 'intl-messageformat';
import ts from 'typescript';

// Feature 010: Student Settings (change password). Labelled sections, one per concern.

// ----------------------------- harness -------------------------------------

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

const rootPath = fileURLToPath(new URL('..', import.meta.url));
const srcPath = path.join(rootPath, 'src');
const settingsPath = path.join(srcPath, 'features/student/settings');

const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  const target = request.startsWith('@/') ? path.join(srcPath, request.slice(2)) : request;
  return resolveFilename.call(this, target, ...rest);
};

process.env.BACKEND_URL = 'https://backend.test/';

const read = (relative) => fs.readFileSync(path.join(rootPath, relative), 'utf8');
const readJson = (relative) => JSON.parse(read(relative));
const messages = { en: readJson('src/messages/en.json'), ar: readJson('src/messages/ar.json') };

const React = loadModule('react');
const { renderToStaticMarkup } = loadModule('react-dom/server');
const { QueryClient, QueryClientProvider } = loadModule('@tanstack/react-query');
const { intlFormats } = loadModule(path.join(srcPath, 'i18n/formatting.ts'));

// Mutable view of the "request": tests set locale/pathname before rendering.
const env = { locale: 'en', pathname: '/student/settings', user: { name: 'Layla Student' } };

const lookup = (namespace, key, locale = env.locale) =>
  `${namespace}.${key}`
    .split('.')
    .reduce(
      (value, part) => (value && typeof value === 'object' ? value[part] : undefined),
      messages[locale]
    );

const format = (message, values, locale = env.locale) =>
  String(new IntlMessageFormat(message, locale, intlFormats).format(values));

const nextIntlStub = {
  useLocale: () => env.locale,
  useTranslations: (namespace) => (key, values) => {
    const message = lookup(namespace, key);
    if (typeof message !== 'string') return `${namespace}.${key}`;
    return format(message, values);
  },
};

const navigationStub = {
  Link: ({ href, children, ...props }) =>
    React.createElement(
      'a',
      { href: typeof href === 'string' ? href : href?.pathname, ...props },
      children
    ),
  usePathname: () => env.pathname,
  useRouter: () => ({ replace() {}, push() {}, prefetch() {} }),
};

const originalLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (request === 'next-intl') return nextIntlStub;
  if (request === '@/i18n/navigation') return navigationStub;
  if (request === '@/features/auth/providers/AuthProvider')
    return { useAuth: () => ({ user: env.user }) };
  if (request === '@/features/auth/hooks/useLogout') {
    return { useLogout: () => ({ mutate() {}, isPending: false }) };
  }
  return originalLoad.call(this, request, parent, ...rest);
};

const loadSrc = (relative) => loadModule(path.join(srcPath, relative));
const loadSettings = (relative) => loadModule(path.join(settingsPath, relative));

function withEnv(vars, fn) {
  const previous = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    if (vars[key] === undefined) delete process.env[key];
    else process.env[key] = vars[key];
  }
  try {
    return fn();
  } finally {
    for (const key of Object.keys(vars)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function render(element, locale = 'en') {
  env.locale = locale;
  const client = new QueryClient();
  return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, element));
}

const flatten = (object, prefix = '') =>
  Object.entries(object).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

const sourceFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : [full];
  });

const stripComments = (code) =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const { ApiError } = loadSrc('lib/api-client.ts');
const { featureFlags } = loadSrc('lib/feature-flags.ts');
const { createChangePasswordSchema, CHANGE_PASSWORD_DEFAULT_VALUES } = loadSettings(
  'schemas/change-password.schema.ts'
);
const { buildChangePasswordRequest } = loadSettings('lib/build-request.ts');
const { changePassword } = loadSettings('api/change-password.ts');
const { classifyChangePasswordError, describeChangePasswordFailure, API_CLIENT_FALLBACK_MESSAGE } =
  loadSettings('lib/failure.ts');
const { confirmSession } = loadSettings('lib/session-check.ts');
const { RESET_PASSWORD_MIN_LENGTH, RESET_PASSWORD_SPECIAL_CHARACTERS } = loadSrc(
  'features/auth/schemas/password.schema.ts'
);

// ----------------------------- flag gating ---------------------------------

test('flag: SETTINGS_ENABLED is off when unset and only the literal "true" turns it on', () => {
  withEnv({ SETTINGS_ENABLED: undefined }, () => assert.equal(featureFlags.settingsEnabled, false));
  for (const value of ['', 'false', '0', '1', 'yes', 'TRUE', 'True', ' true', 'true ', 'on']) {
    withEnv({ SETTINGS_ENABLED: value }, () =>
      assert.equal(featureFlags.settingsEnabled, false, `value=${JSON.stringify(value)}`)
    );
  }
  withEnv({ SETTINGS_ENABLED: 'true' }, () => assert.equal(featureFlags.settingsEnabled, true));
});

test('flag: it is read on every access, server-side only, and never NEXT_PUBLIC_', () => {
  const flags = read('src/lib/feature-flags.ts');
  assert.match(flags, /process\.env\.SETTINGS_ENABLED === 'true'/);
  assert.doesNotMatch(flags, /NEXT_PUBLIC_SETTINGS/);
  withEnv({ SETTINGS_ENABLED: 'true' }, () => assert.equal(featureFlags.settingsEnabled, true));
  withEnv({ SETTINGS_ENABLED: undefined }, () => assert.equal(featureFlags.settingsEnabled, false));
  assert.doesNotMatch(read('.env.example'), /NEXT_PUBLIC_SETTINGS/);
});

test('flag: .env.example documents SETTINGS_ENABLED empty (off)', () => {
  assert.match(read('.env.example'), /^SETTINGS_ENABLED=\s*$/m);
});

test('flag: SETTINGS_ENABLED is turned on only in the e2e config', () => {
  // Nothing that ships or deploys may carry the flag. The e2e config enables it for the
  // flags-on server only; .env.example documents it empty; feature-flags.ts reads it.
  const skip = new Set([
    'node_modules',
    '.next',
    '.git',
    'tests',
    'specs',
    'docs',
    '.specify',
    '.claude',
  ]);
  const walk = (directory) =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      if (skip.has(entry.name) || /^\.env.*\.local$|^\.env\.local$/.test(entry.name)) return [];
      const full = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    });
  const carrying = walk(rootPath)
    .filter((file) => !/\.(png|jpe?g|webp|svg|ico|woff2?|lock|yaml)$/.test(file))
    .filter((file) => fs.readFileSync(file, 'utf8').includes('SETTINGS_ENABLED'))
    .map((file) => path.relative(rootPath, file).replaceAll('\\', '/'))
    .sort();
  assert.deepEqual(carrying, ['.env.example', 'playwright.config.ts', 'src/lib/feature-flags.ts']);

  const playwrightConfig = read('playwright.config.ts');
  assert.match(playwrightConfig, /SETTINGS_ENABLED: flags \? 'true' : ''/);
});

test('route: flag off is the 404 before any rendering; flag on renders the Settings page', () => {
  const Page = loadSrc('app/[locale]/student/settings/page.tsx').default;

  withEnv({ SETTINGS_ENABLED: undefined }, () => {
    assert.throws(
      () => Page(),
      (error) => String(error?.digest ?? error?.message).includes('404'),
      'the page must call notFound() when the flag is off'
    );
  });

  withEnv({ SETTINGS_ENABLED: 'true' }, () => {
    const element = Page();
    assert.equal(element.type.name, 'SettingsPage');
  });
});

test('route: the gate is a Server Component that checks the flag before it returns the page', () => {
  const source = read('src/app/[locale]/student/settings/page.tsx');
  assert.doesNotMatch(source, /['"]use client['"]/);
  assert.ok(
    source.indexOf('featureFlags.settingsEnabled') < source.indexOf('<SettingsPage'),
    'flag is read before the page element is created'
  );
  assert.match(source, /notFound\(\)/);
  assert.doesNotMatch(source, /fetch\(|apiClient|useQuery/);
});

// ----------------------------- navigation and menu --------------------------

test('menu: the Settings item shows only when the flag prop is on, in both languages', () => {
  const { StudentUserMenu } = loadSrc('features/student/layout/StudentUserMenu.tsx');
  for (const locale of ['en', 'ar']) {
    const label = messages[locale].StudentLayout.userMenu.settings;
    const logout = messages[locale].StudentLayout.logout;

    const on = render(
      React.createElement(StudentUserMenu, { defaultOpen: true, settingsEnabled: true }),
      locale
    );
    assert.match(
      on,
      /role="menuitem"[^>]*href="\/student\/settings"|href="\/student\/settings"[^>]*role="menuitem"/
    );
    assert.ok(on.includes(label), `${locale}: "${label}" is in the menu`);
    assert.ok(on.includes(logout), `${locale}: logout stays`);

    const off = render(
      React.createElement(StudentUserMenu, { defaultOpen: true, settingsEnabled: false }),
      locale
    );
    assert.doesNotMatch(off, /\/student\/settings/);
    assert.ok(!off.includes(`>${label}<`), `${locale}: no "${label}" item when the flag is off`);
    assert.ok(off.includes(logout), `${locale}: logout stays`);

    const byDefault = render(React.createElement(StudentUserMenu, { defaultOpen: true }), locale);
    assert.doesNotMatch(byDefault, /\/student\/settings/, 'the item is opt-in');
  }
});

test('menu: Settings comes before Log out, and a closed menu shows neither', () => {
  const { StudentUserMenu } = loadSrc('features/student/layout/StudentUserMenu.tsx');
  const open = render(
    React.createElement(StudentUserMenu, { defaultOpen: true, settingsEnabled: true })
  );
  assert.ok(open.indexOf('/student/settings') < open.indexOf(messages.en.StudentLayout.logout));
  const closed = render(React.createElement(StudentUserMenu, { settingsEnabled: true }));
  assert.doesNotMatch(closed, /\/student\/settings/);
});

test('menu: the flag reaches the menu from the server layout through the shell and header', () => {
  assert.match(
    read('src/app/[locale]/student/layout.tsx'),
    /settingsEnabled: featureFlags\.settingsEnabled/
  );
  assert.match(
    read('src/features/student/layout/StudentShell.tsx'),
    /settingsEnabled=\{settingsEnabled\}/
  );
  assert.match(
    read('src/features/student/layout/StudentHeader.tsx'),
    /settingsEnabled=\{settingsEnabled\}/
  );
});

test('navigation: Settings is in neither the sidebar nor the five-item tab bar', () => {
  const nav = loadSrc('features/student/layout/student-navigation.ts');
  assert.ok(!nav.studentNavigation.some((item) => String(item.id).includes('settings')));
  assert.ok(!nav.studentNavigation.some((item) => item.href.includes('settings')));
  assert.ok(!nav.studentTabBarOrder.includes('settings'));

  const everything = nav.studentNavigation.map((item) => ({ ...item, enabled: true }));
  assert.ok(nav.getStudentTabBarItems(everything).length <= nav.STUDENT_TAB_BAR_MAX_ITEMS);
  assert.ok(
    !nav.getVisibleStudentNavigation(everything).some((item) => item.href.includes('settings'))
  );
  assert.equal(nav.getActiveStudentTabId('/student/settings', everything), null);
  assert.equal(nav.getActiveStudentNavigationItem('/student/settings', everything), null);
});

test('navigation: the header knows the route, so it shows a title', () => {
  const nav = loadSrc('features/student/layout/student-navigation.ts');
  assert.equal(nav.getStudentPageKey('/student/settings'), 'settings');
  assert.equal(nav.getStudentPageKey('/student/settings/'), 'settings');
  assert.equal(nav.getStudentCompactTitleKey('/student/settings'), 'pages.settings.title');
  assert.equal(nav.getStudentPageKey('/student/settingsx'), null);
  for (const locale of ['en', 'ar']) {
    const page = messages[locale].StudentLayout.pages.settings;
    assert.ok(page.title && page.description);
  }
});

// ----------------------------- schema --------------------------------------

const schemaMessages = (locale) => (key, values) =>
  format(messages[locale].Settings.validation[key], values, locale);

function validate(values, locale = 'en') {
  const schema = createChangePasswordSchema(schemaMessages(locale));
  const result = schema.safeParse({ ...CHANGE_PASSWORD_DEFAULT_VALUES, ...values });
  if (result.success) return { ok: true, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}

const VALID = {
  currentPassword: 'Old-passw0rd',
  newPassword: 'N3w-passw0rd!',
  confirmPassword: 'N3w-passw0rd!',
};

test('schema: a valid form passes and keeps the checkbox value', () => {
  assert.deepEqual(validate(VALID), { ok: true, errors: {} });
  assert.deepEqual(validate({ ...VALID, signOutOtherDevices: true }), { ok: true, errors: {} });
  assert.equal(CHANGE_PASSWORD_DEFAULT_VALUES.signOutOtherDevices, false, 'unchecked by default');
});

test('schema: every field is required, and "required" wins over the length rule', () => {
  const { ok, errors } = validate({});
  assert.equal(ok, false);
  assert.equal(errors.currentPassword, messages.en.Settings.validation.currentRequired);
  assert.equal(errors.newPassword, messages.en.Settings.validation.newRequired);
  assert.equal(errors.confirmPassword, messages.en.Settings.validation.confirmRequired);
});

test('schema: the new password follows the shared rules', () => {
  const v = messages.en.Settings.validation;
  const tooShort = validate({ ...VALID, newPassword: 'Ab1!xyz', confirmPassword: 'Ab1!xyz' });
  assert.equal(tooShort.errors.newPassword, format(v.passwordMin, { count: 8 }));
  assert.match(tooShort.errors.newPassword, /\b8\b/, 'the message names the minimum');

  const noDigit = validate({ ...VALID, newPassword: 'Password!', confirmPassword: 'Password!' });
  assert.equal(noDigit.errors.newPassword, v.passwordDigit);

  const noSpecial = validate({ ...VALID, newPassword: 'Password1', confirmPassword: 'Password1' });
  assert.equal(noSpecial.errors.newPassword, v.passwordSpecial);
});

test('schema: the length boundary is exactly 8', () => {
  assert.equal(
    validate({ ...VALID, newPassword: 'Abcdef1!', confirmPassword: 'Abcdef1!' }).ok,
    true
  );
  assert.equal(
    validate({ ...VALID, newPassword: 'Abcde1!', confirmPassword: 'Abcde1!' }).ok,
    false
  );
});

test('schema: each documented special character is accepted, and others are not', () => {
  for (const character of RESET_PASSWORD_SPECIAL_CHARACTERS) {
    const password = `Passw0rd${character}`;
    assert.equal(
      validate({ ...VALID, newPassword: password, confirmPassword: password }).ok,
      true,
      `"${character}" counts as a special character`
    );
  }
  for (const character of ['-', '_', ' ', '+', '=', '~']) {
    const password = `Passw0rd${character}`;
    const result = validate({ ...VALID, newPassword: password, confirmPassword: password });
    assert.equal(result.ok, false, `"${character}" is not in the documented set`);
    assert.equal(result.errors.newPassword, messages.en.Settings.validation.passwordSpecial);
  }
});

test('schema: the rules come from password.schema.ts, not a second copy', () => {
  const source = stripComments(
    read('src/features/student/settings/schemas/change-password.schema.ts')
  );
  assert.match(source, /from '@\/features\/auth\/schemas\/password\.schema'/);
  assert.match(source, /createResetPasswordValueSchema/);
  assert.doesNotMatch(source, /\.regex\(/, 'no regex rule of its own');
  assert.doesNotMatch(source, /\\d|\[!@#/, 'no digit or special-character pattern of its own');
  assert.doesNotMatch(source, /\.min\(\s*8/, 'no length rule of its own');
  assert.equal(RESET_PASSWORD_MIN_LENGTH, 8);
});

test('schema: the confirmation must match, and the error sits on the confirmation field', () => {
  const result = validate({ ...VALID, confirmPassword: 'N3w-passw0rd?' });
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors), ['confirmPassword']);
  assert.equal(result.errors.confirmPassword, messages.en.Settings.validation.passwordMismatch);
});

test('schema: the new password must differ from the current one, and the error sits on it', () => {
  const same = 'Same-passw0rd!';
  const result = validate({ currentPassword: same, newPassword: same, confirmPassword: same });
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors), ['newPassword']);
  assert.equal(result.errors.newPassword, messages.en.Settings.validation.sameAsCurrent);
  // Case matters: a different case is a different password.
  assert.equal(
    validate({ currentPassword: 'same-passw0rd!', newPassword: same, confirmPassword: same }).ok,
    true
  );
});

test('schema: no trimming; a password with spaces is compared as typed', () => {
  assert.equal(
    validate({ ...VALID, newPassword: ' N3w-passw0rd!', confirmPassword: 'N3w-passw0rd!' }).ok,
    false
  );
  assert.equal(
    validate({ ...VALID, newPassword: 'N3w passw0rd!', confirmPassword: 'N3w passw0rd!' }).ok,
    true
  );
});

test('schema: Arabic messages are used in the Arabic locale', () => {
  const { errors } = validate({}, 'ar');
  assert.equal(errors.currentPassword, messages.ar.Settings.validation.currentRequired);
  const short = validate({ ...VALID, newPassword: 'Ab1!', confirmPassword: 'Ab1!' }, 'ar');
  assert.match(short.errors.newPassword, /8/);
  assert.doesNotMatch(short.errors.newPassword, /[٠-٩]/, 'Latin digits');
});

// ----------------------------- request -------------------------------------

test('request: exactly current_password, new_password and invalidate_other_sessions', () => {
  const body = buildChangePasswordRequest({
    currentPassword: 'Old-passw0rd',
    newPassword: 'N3w-passw0rd!',
    signOutOtherDevices: true,
  });
  assert.deepEqual(body, {
    current_password: 'Old-passw0rd',
    new_password: 'N3w-passw0rd!',
    invalidate_other_sessions: true,
  });
  assert.deepEqual(Object.keys(body).sort(), [
    'current_password',
    'invalidate_other_sessions',
    'new_password',
  ]);
});

test('request: the checkbox is a real boolean, false by default', () => {
  const body = buildChangePasswordRequest({ ...CHANGE_PASSWORD_DEFAULT_VALUES });
  assert.strictEqual(body.invalidate_other_sessions, false);
  assert.strictEqual(
    buildChangePasswordRequest({ ...VALID, signOutOtherDevices: true }).invalidate_other_sessions,
    true
  );
});

test('request: nothing else on the form leaks into the body', () => {
  const body = buildChangePasswordRequest({
    ...VALID,
    signOutOtherDevices: false,
    // Fields that must never be sent, in case a future form value is spread in by mistake.
    old_password: 'x',
    revoke_other_sessions: true,
    email: 'a@b.c',
  });
  assert.deepEqual(Object.keys(body).sort(), [
    'current_password',
    'invalidate_other_sessions',
    'new_password',
  ]);
  assert.ok(!('confirmPassword' in body) && !('confirm_password' in body));
  assert.ok(!('old_password' in body) && !('revoke_other_sessions' in body));
});

test('request: passwords are sent exactly as typed', () => {
  const body = buildChangePasswordRequest({
    currentPassword: '  spaced ',
    newPassword: 'ÄÖ-ü 1!',
    signOutOtherDevices: false,
  });
  assert.equal(body.current_password, '  spaced ');
  assert.equal(body.new_password, 'ÄÖ-ü 1!');
});

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('request: one POST to /auth/change-password with the three fields and the session cookie', async () => {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ message: 'Password changed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await changePassword(
    buildChangePasswordRequest({ ...VALID, signOutOtherDevices: true })
  );

  assert.deepEqual(response, { message: 'Password changed' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://backend.test/auth/change-password');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'include');
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    current_password: VALID.currentPassword,
    new_password: VALID.newPassword,
    invalidate_other_sessions: true,
  });
});

test('request: it goes through apiClient, never a raw fetch of its own', () => {
  const source = read('src/features/student/settings/api/change-password.ts');
  assert.match(source, /from '@\/lib\/api-client'/);
  assert.doesNotMatch(source, /\bfetch\(/);
  assert.match(source, /'\/auth\/change-password'/);
});

// ----------------------------- errors ---------------------------------------

const apiError = (status, message, details = []) => new ApiError(message, details, status);
const feedbackText = (key) => messages.en.Settings.feedback[key];
const describe = (error) =>
  describeChangePasswordFailure(classifyChangePasswordError(error), feedbackText);

test('errors: 400 shows the backend detail in a form alert and clears the passwords', () => {
  const failure = classifyChangePasswordError(apiError(400, 'Current password is incorrect'));
  assert.deepEqual(failure, { kind: 'rejected', message: 'Current password is incorrect' });
  assert.deepEqual(describe(apiError(400, 'Current password is incorrect')), {
    formError: 'Current password is incorrect',
    fieldErrors: {},
    clearPasswords: true,
    recheckSession: false,
  });
});

test('errors: a 400 without a usable detail falls back to translated text, never "error happen"', () => {
  assert.equal(API_CLIENT_FALLBACK_MESSAGE, 'error happen');
  for (const message of [API_CLIENT_FALLBACK_MESSAGE, '', '   ']) {
    const feedback = describe(apiError(400, message));
    assert.equal(feedback.formError, feedbackText('rejected'), JSON.stringify(message));
    assert.equal(feedback.clearPasswords, true);
  }
});

test('errors: 422 maps field errors to fields, including the old_password alias', () => {
  const error = apiError(422, 'bad', [
    { loc: ['body', 'new_password'], msg: 'Password too weak' },
    { loc: ['body', 'old_password'], msg: 'Field required' },
  ]);
  assert.deepEqual(classifyChangePasswordError(error), {
    kind: 'validation',
    fields: { newPassword: 'Password too weak', currentPassword: 'Field required' },
    unmapped: null,
  });
  assert.deepEqual(describe(error), {
    formError: null,
    fieldErrors: { newPassword: 'Password too weak', currentPassword: 'Field required' },
    clearPasswords: false,
    recheckSession: false,
  });
  const byCurrent = apiError(422, 'x', [
    { loc: ['body', 'current_password'], msg: 'Field required' },
  ]);
  assert.deepEqual(describe(byCurrent).fieldErrors, { currentPassword: 'Field required' });
});

test('errors: 422 with an unmappable location is a form alert; typed values stay', () => {
  const error = apiError(422, 'Extra inputs are not permitted', [
    { loc: ['body', 'invalidate_other_sessions'], msg: 'Input should be a valid boolean' },
  ]);
  const feedback = describe(error);
  assert.equal(feedback.formError, 'Input should be a valid boolean');
  assert.deepEqual(feedback.fieldErrors, {});
  assert.equal(feedback.clearPasswords, false);

  const mixed = describe(
    apiError(422, 'x', [
      { loc: ['body', 'new_password'], msg: 'Too weak' },
      { loc: ['body'], msg: 'Something else' },
    ])
  );
  assert.deepEqual(mixed.fieldErrors, { newPassword: 'Too weak' });
  assert.equal(mixed.formError, 'Something else');
});

test('errors: a 422 with nothing to show uses the translated text', () => {
  assert.equal(
    describe(apiError(422, API_CLIENT_FALLBACK_MESSAGE)).formError,
    feedbackText('invalid')
  );
  assert.equal(describe(apiError(422, 'Invalid JSON')).formError, 'Invalid JSON');
});

test('errors: 401 re-checks the session and keeps what was typed', () => {
  assert.deepEqual(classifyChangePasswordError(apiError(401, 'Not authenticated')), {
    kind: 'unauthorized',
  });
  assert.deepEqual(describe(apiError(401, 'Not authenticated')), {
    formError: feedbackText('sessionExpired'),
    fieldErrors: {},
    clearPasswords: false,
    recheckSession: true,
  });
});

test('errors: network failures, 5xx and unlisted statuses get the generic translated error', () => {
  for (const error of [
    new TypeError('Failed to fetch'),
    apiError(500, 'boom'),
    apiError(502, API_CLIENT_FALLBACK_MESSAGE),
    apiError(503, 'unavailable'),
    apiError(403, 'Forbidden'),
    apiError(404, 'Not found'),
    undefined,
    'string',
  ]) {
    assert.deepEqual(describe(error), {
      formError: feedbackText('unavailable'),
      fieldErrors: {},
      clearPasswords: false,
      recheckSession: false,
    });
  }
});

test('errors: only a 400 clears the password fields', () => {
  const statuses = [400, 401, 403, 404, 422, 429, 500, 503];
  const cleared = statuses.filter((status) => describe(apiError(status, 'x')).clearPasswords);
  assert.deepEqual(cleared, [400]);
});

test('errors: the translated fallbacks exist in both languages', () => {
  for (const locale of ['en', 'ar']) {
    for (const key of ['rejected', 'invalid', 'sessionExpired', 'unavailable', 'success']) {
      assert.ok(messages[locale].Settings.feedback[key], `${locale}.Settings.feedback.${key}`);
    }
  }
});

// ----------------------------- session re-check -----------------------------

test('session: a 401 from /auth/me sends the student to login (once)', async () => {
  let expired = 0;
  const result = await confirmSession(
    async () => ({ error: apiError(401, 'Not authenticated') }),
    () => expired++
  );
  assert.equal(result, 'expired');
  assert.equal(expired, 1);
});

test('session: a valid session leaves the student on the page', async () => {
  let expired = 0;
  const result = await confirmSession(
    async () => ({ error: null }),
    () => expired++
  );
  assert.equal(result, 'valid');
  assert.equal(expired, 0);
});

test('session: a failed check that is not a 401 does not log the student out', async () => {
  for (const error of [
    new TypeError('Failed to fetch'),
    apiError(500, 'boom'),
    apiError(403, 'no'),
  ]) {
    let expired = 0;
    const result = await confirmSession(
      async () => ({ error }),
      () => expired++
    );
    assert.equal(result, 'unknown');
    assert.equal(expired, 0);
  }
});

test('session: the redirect uses the existing return-path helper and the current-user query', () => {
  const hook = read('src/features/student/settings/hooks/useSessionCheck.ts');
  assert.match(hook, /useCurrentUser/);
  assert.match(hook, /loginPathWithNext/);
  const { loginPathWithNext } = loadSrc('features/auth/lib/post-login-path.ts');
  assert.equal(loginPathWithNext('/student/settings'), '/login?next=%2Fstudent%2Fsettings');
});

// ----------------------------- form markup ----------------------------------

test('form: labels, autocomplete, toggles and an unchecked checkbox, in both languages', () => {
  const { ChangePasswordForm } = loadSettings('components/ChangePasswordForm.tsx');
  for (const locale of ['en', 'ar']) {
    const m = messages[locale].Settings.changePassword;
    const html = render(React.createElement(ChangePasswordForm), locale);

    for (const label of [
      m.currentPassword,
      m.newPassword,
      m.confirmPassword,
      m.signOutOtherDevices,
    ]) {
      assert.ok(html.includes(`>${label}</label>`), `${locale}: label "${label}"`);
    }
    assert.equal((html.match(/type="password"/g) ?? []).length, 3, 'three password inputs');
    assert.equal((html.match(/dir="ltr"/g) ?? []).length, 3);
    assert.match(html, /autoComplete="current-password"|autocomplete="current-password"/i);
    assert.equal((html.match(/autocomplete="new-password"/gi) ?? []).length, 2);
    assert.equal((html.match(new RegExp(`aria-label="${m.showPassword}"`, 'g')) ?? []).length, 3);
    assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 3);
    assert.match(html, /type="checkbox"/);
    assert.doesNotMatch(html, /type="checkbox"[^>]*checked/);
    assert.ok(html.includes(m.submit), `${locale}: submit button`);
    assert.match(html, /<form[^>]*novalidate/i);
    assert.doesNotMatch(html, /role="alert"/, 'no alert before anything happens');
    assert.doesNotMatch(html, /Settings\.(changePassword|validation|feedback)\./, 'no missing key');
  }
});

test('form: the page frames the form under a heading and uses the shared card look', () => {
  const { SettingsPage } = loadSettings('components/SettingsPage.tsx');
  const html = render(React.createElement(SettingsPage));
  assert.match(html, /<h2[^>]*>Change password<\/h2>/);
  assert.match(html, /rounded-2xl border border-gray-300 bg-white/);
  assert.ok(html.includes(messages.en.Settings.changePassword.description));
});

// ----------------------------- copy, plurals, direction ----------------------

test('i18n: the Settings namespace and the shell keys have the same keys in en and ar', () => {
  const pick = (locale) =>
    flatten({
      Settings: messages[locale].Settings,
      pages: messages[locale].StudentLayout.pages.settings,
      userMenu: messages[locale].StudentLayout.userMenu,
    }).sort();
  assert.deepEqual(pick('en'), pick('ar'));
  assert.ok(pick('en').includes('Settings.changePassword.title'));
  assert.ok(pick('en').includes('userMenu.settings'));
});

test('i18n: no Settings message is empty, and none is left in English in the Arabic file', () => {
  for (const locale of ['en', 'ar']) {
    for (const key of flatten(messages[locale].Settings)) {
      const value = key.split('.').reduce((v, part) => v[part], messages[locale].Settings);
      assert.ok(typeof value === 'string' && value.trim().length > 0, `${locale}.${key}`);
    }
  }
  const arabic = /[؀-ۿ]/;
  for (const key of flatten(messages.ar.Settings)) {
    const value = key.split('.').reduce((v, part) => v[part], messages.ar.Settings);
    assert.match(value, arabic, `ar.Settings.${key} is Arabic`);
  }
});

test('i18n: Arabic plurals carry every category and pin Latin digits', () => {
  const plurals = flatten(messages.ar.Settings)
    .map((key) => [key, key.split('.').reduce((v, part) => v[part], messages.ar.Settings)])
    .filter(([, value]) => value.includes(', plural,'));
  assert.ok(plurals.length >= 2, 'Settings uses plurals (minimum length and its hint)');
  for (const [key, value] of plurals) {
    assert.match(value, /(=0|zero) \{/, `${key}: zero`);
    for (const category of ['one', 'two', 'few', 'many', 'other']) {
      assert.match(value, new RegExp(`\\b${category} \\{`), `${key}: ${category}`);
    }
    assert.doesNotMatch(value, /#/, `${key}: uses {count, number, integer}, not #`);
    for (const count of [0, 1, 2, 3, 11, 100]) {
      const text = format(value, { count }, 'ar');
      assert.ok(text.length > 0);
      assert.doesNotMatch(text, /[٠-٩]/, `${key} (${count}): Latin digits`);
    }
  }
  // English: one and other, no "#".
  for (const key of flatten(messages.en.Settings)) {
    const value = key.split('.').reduce((v, part) => v[part], messages.en.Settings);
    if (!value.includes(', plural,')) continue;
    assert.match(value, /\bone \{/);
    assert.match(value, /\bother \{/);
    assert.doesNotMatch(value, /#/);
  }
});

test('i18n: the length message shows 8 in the right plural form in Arabic', () => {
  const message = messages.ar.Settings.validation.passwordMin;
  assert.equal(format(message, { count: 8 }, 'ar'), 'يجب ألا تقل كلمة المرور عن 8 أحرف');
  assert.equal(format(message, { count: 11 }, 'ar'), 'يجب ألا تقل كلمة المرور عن 11 حرفًا');
});

test('copy: the feature has no hardcoded user-facing text', () => {
  const files = sourceFiles(settingsPath).filter((file) => /\.tsx?$/.test(file));
  assert.ok(files.length >= 8);
  const arabic = /[؀-ۿ]/;
  // Text between a closing ">" and the next "<" in JSX. "=>" is an arrow, not a tag end.
  const jsxText = /(?<!=)>\s*[A-Za-z][A-Za-z0-9 ,.!?'’-]{2,}\s*</;
  const literalAttribute = /\b(aria-label|placeholder|title|alt)="[^"{]+"/;
  for (const file of files) {
    const code = stripComments(fs.readFileSync(file, 'utf8'));
    const name = path.relative(rootPath, file);
    assert.doesNotMatch(code, arabic, `${name}: Arabic text`);
    if (file.endsWith('.tsx')) {
      assert.doesNotMatch(code, jsxText, `${name}: English JSX text`);
      assert.doesNotMatch(code, literalAttribute, `${name}: literal accessible text`);
    }
  }
});

test('layout: only logical CSS properties in the feature and the new menu link', () => {
  const physical =
    /(?:^|[\s"'`])(?:-?(?:ml|mr|pl|pr|left|right)-[\w[]|text-(?:left|right)|rounded-[lr]-|rounded-(?:tl|tr|bl|br)-|border-[lr]-|border-[lr]\b|float-(?:left|right)|space-x-)/;
  for (const file of sourceFiles(settingsPath).filter((f) => f.endsWith('.tsx'))) {
    const code = stripComments(fs.readFileSync(file, 'utf8'));
    assert.doesNotMatch(code, physical, path.relative(rootPath, file));
  }
  const menu = read('src/features/student/layout/StudentUserMenu.tsx');
  const link = menu.slice(
    menu.indexOf('href="/student/settings"'),
    menu.indexOf('userMenu.settings')
  );
  assert.doesNotMatch(link, physical);
});

test('layout: the form never overflows a 390px screen', () => {
  const form = read('src/features/student/settings/components/ChangePasswordForm.tsx');
  assert.match(form, /max-w-md/, 'capped on wide screens');
  assert.match(form, /w-full/, 'the button fills a phone');
  assert.doesNotMatch(form, /\bw-\[\d{3,}px\]|min-w-\[\d{3,}px\]/, 'no fixed pixel widths');
});

test('security: the form never logs or stores a password', () => {
  for (const file of sourceFiles(settingsPath).filter((f) => /\.tsx?$/.test(f))) {
    const code = stripComments(fs.readFileSync(file, 'utf8'));
    const name = path.relative(rootPath, file);
    assert.doesNotMatch(code, /console\.|localStorage|sessionStorage|document\.cookie/, name);
  }
});

test('production import guard: the feature imports nothing from tests, scripts or fixtures', () => {
  for (const file of sourceFiles(settingsPath)) {
    assert.doesNotMatch(
      fs.readFileSync(file, 'utf8'),
      /from ['"][^'"]*(\/tests\/|\/scripts\/|\/fixtures\/)/,
      path.relative(rootPath, file)
    );
  }
});
