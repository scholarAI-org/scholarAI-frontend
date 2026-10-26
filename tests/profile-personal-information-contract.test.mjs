import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
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

// Guards the PUT /profile/personal-info body against the committed backend contract
// (docs/api/openapi.json). The backend schema forbids extra keys, so a renamed or
// stale key is rejected with a 422 and the step silently stops saving.
const feature = fileURLToPath(new URL('../src/features/profile', import.meta.url));
const openapi = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('../docs/api/openapi.json', import.meta.url)), 'utf8')
);
const personalInfo = openapi.components.schemas.PersonalInfo;
const { toPersonalInformationPayload, toPersonalInformationForm } = loadModule(
  path.join(feature, 'lib/personal-information.ts')
);
const { personalInformationApiSchema, emptyPersonalInformation } = loadModule(
  path.join(feature, 'schemas/personal-information-api.schema.ts')
);

const form = {
  firstName: 'سارة أحمد محمد علي',
  lastName: 'Sara Ahmad Mohammad Ali',
  email: 'sara@example.com',
  phone: '+970599123456',
  gender: 'FEMALE',
  birthDate: '2000-01-15',
  nationalityCode: 'PS',
  residenceCountryCode: 'JO',
  nationalId: '123456789',
  passportNumber: 'AB123456',
  city: 'Amman',
  financialSituation: 'MODERATE',
};
const minimalForm = {
  ...form,
  phone: '',
  nationalId: '',
  passportNumber: '',
  city: '',
};

const refName = (ref) => ref.split('/').pop();

function assertMatchesContract(payload) {
  assert.equal(personalInfo.additionalProperties, false, 'contract no longer forbids extra keys');
  const allowed = Object.keys(personalInfo.properties);
  assert.deepEqual(
    personalInfo.required.filter((key) => !(key in payload)),
    [],
    'required keys missing from the payload'
  );
  assert.deepEqual(
    Object.keys(payload).filter((key) => !allowed.includes(key)),
    [],
    'payload has keys the backend rejects'
  );
  for (const [key, value] of Object.entries(payload)) {
    const property = personalInfo.properties[key];
    if (property.$ref) {
      const enumValues = openapi.components.schemas[refName(property.$ref)].enum;
      assert.ok(enumValues.includes(value), `${key}: ${value} is not in ${enumValues}`);
      continue;
    }
    const variants = property.anyOf ?? [property];
    const string = variants.find((variant) => variant.type === 'string');
    assert.equal(typeof value, 'string', key);
    if (string.minLength !== undefined) assert.ok(value.length >= string.minLength, key);
    if (string.maxLength !== undefined) assert.ok(value.length <= string.maxLength, key);
    if (string.pattern) assert.match(value, new RegExp(string.pattern), key);
  }
}

test('payload keys sent to PUT /profile/personal-info match the committed PersonalInfo contract', () => {
  for (const values of [form, minimalForm]) {
    const payload = JSON.parse(JSON.stringify(toPersonalInformationPayload(values)));
    assertMatchesContract(payload);
  }
});

test('payload keys are exactly the contract keys for a fully filled form', () => {
  const payload = JSON.parse(JSON.stringify(toPersonalInformationPayload(form)));
  assert.deepEqual(Object.keys(payload).sort(), Object.keys(personalInfo.properties).sort());
});

test('response and empty-default keys do not drift from the contract', () => {
  assert.deepEqual(
    Object.keys(personalInformationApiSchema.shape).sort(),
    Object.keys(personalInfo.properties).sort()
  );
  assert.deepEqual(
    Object.keys(emptyPersonalInformation).sort(),
    Object.keys(personalInfo.properties).sort()
  );
});

test('names from a GET response reach the form, and survive a save round trip', () => {
  const response = {
    full_name_ar: 'أحمد محمد علي حسن',
    full_name_en: 'Ahmad Mohammad Ali Hassan',
    email: 'a@example.com',
    birth_date: '2000-01-15',
    gender: 'MALE',
    nationality: 'PS',
    country_of_residence: 'JO',
    financial_status: 'STABLE',
  };
  const loaded = toPersonalInformationForm(response);
  assert.equal(loaded.firstName, 'أحمد محمد علي حسن');
  assert.equal(loaded.lastName, 'Ahmad Mohammad Ali Hassan');
  const payload = JSON.parse(JSON.stringify(toPersonalInformationPayload(loaded)));
  assert.equal(payload.full_name_ar, response.full_name_ar);
  assert.equal(payload.full_name_en, response.full_name_en);
});
