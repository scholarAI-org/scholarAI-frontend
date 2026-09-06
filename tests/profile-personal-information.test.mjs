import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import ts from 'typescript';

const loadModule = createRequire(import.meta.url);

// Use the existing TypeScript compiler with Node's test runner; no test framework
// or application runtime loader is needed for these pure schema/mapper tests.
loadModule.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};

const feature = fileURLToPath(new URL('../src/features/profile', import.meta.url));
const { createPersonalInformationSchema } = loadModule(
  path.join(feature, 'schemas/personal-information.schema.ts')
);
const {
  toPersonalInformationForm,
  toPersonalInformationPayload,
  emptyPersonalInformation,
  getPersonalInformationCompletion,
  personalInformationFieldMap,
} = loadModule(path.join(feature, 'lib/personal-information.ts'));
const schema = createPersonalInformationSchema((key) => key);
const { composeInternationalPhone, findCallingCodeForPhone } = loadModule(
  path.join(feature, 'lib/phone-number.ts')
);
const resource = {
  first_name: 'Sara',
  last_name: 'Ahmad',
  email: 'sara@example.com',
  birth_date: '2000-01-15',
  gender: 'FEMALE',
  nationality: 'PS',
  country_of_residence: 'JO',
  phone_number: '+970599123456',
  city: 'Amman',
  financial_status: 'MODERATE',
  id_number: '123456789',
  passport_number: 'AB123456',
};
const form = toPersonalInformationForm(resource);
const jsonPayload = (values) =>
  JSON.parse(JSON.stringify(toPersonalInformationPayload(schema.parse(values))));

test('round-trips every backend field without sending camelCase or extra form fields', () => {
  assert.deepEqual(jsonPayload({ ...form, unrelated: 'must not be sent' }), resource);
  assert.deepEqual(Object.keys(personalInformationFieldMap).sort(), Object.keys(resource).sort());
});

test('omits blank optional fields without inventing nulls or unsupported financial values', () => {
  const payload = jsonPayload({
    ...form,
    phone: '',
    city: ' ',
    nationalId: '',
    passportNumber: '',
    financialSituation: '',
  });
  assert.deepEqual(
    Object.keys(payload).sort(),
    [
      'first_name',
      'last_name',
      'email',
      'birth_date',
      'gender',
      'nationality',
      'country_of_residence',
    ].sort()
  );
  assert.equal(payload.gender, 'FEMALE');
});

test('accepts the backend gender and financial enums', () => {
  for (const gender of ['MALE', 'FEMALE']) {
    for (const financialSituation of ['LIMITED', 'MODERATE', 'STABLE', '']) {
      assert.equal(schema.safeParse({ ...form, gender, financialSituation }).success, true);
    }
  }
});

test('rejects missing required values, obsolete enums, invalid country codes and dates', () => {
  for (const [field, value] of [
    ['firstName', ''],
    ['lastName', ''],
    ['email', ''],
    ['email', 'invalid'],
    ['gender', 'male'],
    ['gender', ''],
    ['financialSituation', 'excellent'],
    ['nationalityCode', 'PAL'],
    ['residenceCountryCode', 'p'],
    ['birthDate', '2000-02-31'],
    ['birthDate', '2999-01-01'],
  ]) {
    assert.equal(
      schema.safeParse({ ...form, [field]: value }).success,
      false,
      `${field}: ${value}`
    );
  }
});

test('normalizes dates, country codes, names and document identifiers', () => {
  const loaded = toPersonalInformationForm({
    ...resource,
    birth_date: '2000-01-15T00:00:00Z',
    nationality: 'ps',
  });
  assert.equal(loaded.birthDate, '2000-01-15');
  assert.equal(loaded.nationalityCode, 'PS');
  const payload = jsonPayload({
    ...form,
    firstName: '  Sara  ',
    nationalId: '123 456 789',
    passportNumber: 'ab 123456',
  });
  assert.equal(payload.first_name, 'Sara');
  assert.equal(payload.id_number, '123456789');
  assert.equal(payload.passport_number, 'AB123456');
});

test('completion reflects valid required personal fields, not other sections or optional data', () => {
  assert.equal(getPersonalInformationCompletion(emptyPersonalInformation), 0);
  assert.equal(getPersonalInformationCompletion(form), 100);
  assert.equal(getPersonalInformationCompletion({ ...form, email: '' }), 86);
  assert.equal(
    getPersonalInformationCompletion({ ...form, financialSituation: '', city: '' }),
    100
  );
});

test('accepts live backend null optional fields and hydrates editable empty values', () => {
  const { personalInformationApiSchema } = loadModule(
    path.join(feature, 'schemas/personal-information-api.schema.ts')
  );
  const optionalFields = [
    'phone_number',
    'city',
    'financial_status',
    'id_number',
    'passport_number',
  ];
  const response = personalInformationApiSchema.parse({
    ...resource,
    ...Object.fromEntries(optionalFields.map((field) => [field, null])),
  });
  const loaded = toPersonalInformationForm(response);
  for (const field of optionalFields) {
    assert.equal(loaded[personalInformationFieldMap[field]], '');
  }
  assert.equal(schema.safeParse(loaded).success, true);
  assert.equal(
    personalInformationApiSchema.safeParse({ ...resource, gender: null }).success,
    false
  );
  assert.equal(
    personalInformationApiSchema.safeParse({ ...resource, financial_status: 'UNKNOWN' }).success,
    false
  );
});

test('combines a country calling code with a local phone number', () => {
  const options = [
    { value: 'PS-0', label: 'Palestine (+970)', countryCode: 'PS', dialCode: '+970' },
    { value: 'JO-0', label: 'Jordan (+962)', countryCode: 'JO', dialCode: '+962' },
  ];
  assert.equal(composeInternationalPhone(options[0], '0594 189 740'), '+970594189740');
  assert.equal(composeInternationalPhone(options[1], '079-123-4567'), '+962791234567');
  assert.equal(composeInternationalPhone(options[0], ''), '');
  assert.equal(findCallingCodeForPhone('+970594189740', options).countryCode, 'PS');
  assert.equal(schema.safeParse({ ...form, phone: '+970594189740' }).success, true);
  assert.equal(schema.safeParse({ ...form, phone: '0594189740' }).success, false);
});
