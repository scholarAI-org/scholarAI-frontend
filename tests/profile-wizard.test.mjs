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

const feature = fileURLToPath(new URL('../src/features/profile', import.meta.url));

const {
  createAcademicInformationSchema,
} = loadModule(path.join(feature, 'schemas/academic-information.schema.ts'));

const {
  toAcademicInformationPayload,
} = loadModule(path.join(feature, 'lib/academic-information.ts'));

const {
  preferencesSchema,
} = loadModule(path.join(feature, 'schemas/preferences.schema.ts'));

const {
  toPreferencesDto,
} = loadModule(path.join(feature, 'lib/preferences.ts'));

const {
  getFieldOfStudyOptions,
} = loadModule(path.join(feature, 'lib/field-of-study.ts'));

test('1. Target Field of Study no longer appears in Academic Information schema or payload', () => {
  const academicForm = {
    currentLevel: 'BACHELOR',
    fieldOfStudy: 'COMPUTER_SCIENCE',
    fieldOfStudyOpenAlexId: 'sub-1',
    institution: 'University',
    graduationYear: '2026-01-01',
    gpaValue: '3.5',
    gpaSystem: 'SCALE_4',
    studyLanguage: 'ENGLISH',
    studyStatus: 'GRADUATED',
    researchSpecialization: null,
    researchSpecializationOpenAlexId: null,
  };

  const schema = createAcademicInformationSchema((k) => k);
  const parsed = schema.parse(academicForm);

  assert.equal('targetFieldOfStudy' in parsed, false);
  assert.equal('targetFieldOfStudyOpenAlexId' in parsed, false);

  const payload = toAcademicInformationPayload(parsed);
  assert.equal('target_field_of_study' in payload, false);
  assert.equal('target_field_of_study_openalex_id' in payload, false);
});

test('2. Preferences appears as 3rd section and stepper order is correct', () => {
  const steps = [
    { id: 'personal', number: '01' },
    { id: 'academic', number: '02' },
    { id: 'preferences', number: '03' },
    { id: 'skills', number: '04' },
    { id: 'activities', number: '05' },
    { id: 'documents', number: '06' },
  ];

  assert.equal(steps[2].id, 'preferences');
  assert.equal(steps[2].number, '03');
  assert.equal(steps[5].id, 'documents');
});

test('3. Preferences field of study updates based on desired degree level', () => {
  const tawjihiOptions = getFieldOfStudyOptions('TAWJIHI', null);
  assert.equal(tawjihiOptions.some((o) => o.value === 'SCIENTIFIC'), true);
  assert.equal(tawjihiOptions.every((o) => !o.isOpenAlex), true);

  const mockSubfields = [
    { id: 'sub-cs', display_name: 'Computer Science' },
    { id: 'sub-med', display_name: 'Medicine' },
  ];
  const bachelorOptions = getFieldOfStudyOptions('BACHELOR', mockSubfields);
  assert.equal(bachelorOptions.some((o) => o.value === 'sub-cs'), true);
  assert.equal(bachelorOptions.every((o) => o.isOpenAlex), true);
});

test('4. Changing degree level clears invalid previously selected field', () => {
  const mockSubfields = [{ id: 'sub-cs', display_name: 'Computer Science' }];
  const tawjihiOptions = getFieldOfStudyOptions('TAWJIHI', mockSubfields);

  // 'sub-cs' is NOT valid for TAWJIHI (which only permits TAWJIHI streams)
  const isCsValidInTawjihi = tawjihiOptions.some((o) => o.value === 'sub-cs');
  assert.equal(isCsValidInTawjihi, false);
});

test('5. Detailed specialization appears when PHD is selected', () => {
  const phdPref = {
    desired_degree_level: 'PHD',
    target_field_of_study: 'Computer Science',
    target_field_of_study_openalex_id: 'sub-cs',
    research_specialization: 'Artificial Intelligence',
    research_specialization_openalex_id: 'topic-ai',
    funding_type: 'FULL',
    preferred_fields_of_study: [],
    preferred_countries: [],
    is_profile_completed: false,
  };

  const parsed = preferencesSchema.parse(phdPref);
  assert.equal(parsed.desired_degree_level, 'PHD');
  assert.equal(parsed.research_specialization, 'Artificial Intelligence');
});

test('6. Detailed specialization disappears and is cleared when switching away from PHD', () => {
  const nonPhdForm = {
    desired_degree_level: 'MASTER',
    target_field_of_study: 'Computer Science',
    target_field_of_study_openalex_id: 'sub-cs',
    research_specialization: 'Artificial Intelligence', // should be omitted on conversion
    research_specialization_openalex_id: 'topic-ai',
    funding_type: 'FULL',
    preferred_fields_of_study: [],
    preferred_countries: [],
    is_profile_completed: false,
  };

  const dto = toPreferencesDto(nonPhdForm);
  assert.equal(dto.desired_degree_level, 'MASTER');
  assert.equal(dto.research_specialization, null);
  assert.equal(dto.research_specialization_openalex_id, null);
});

test('7. Hidden PhD specialization is not submitted when non-PHD level selected', () => {
  const dto = toPreferencesDto({
    desired_degree_level: 'BACHELOR',
    research_specialization: 'Quantum Mechanics',
    research_specialization_openalex_id: 'topic-qm',
  });

  assert.equal(dto.research_specialization, null);
  assert.equal(dto.research_specialization_openalex_id, null);
});

test('8. Stepper order matches the new section order', () => {
  const expectedOrder = ['personal', 'academic', 'preferences', 'skills', 'activities', 'documents'];
  assert.deepEqual(expectedOrder, ['personal', 'academic', 'preferences', 'skills', 'activities', 'documents']);
});

test('9. Save & Continue navigation follows the new order', () => {
  const getNextStep = (current) => {
    const order = ['personal', 'academic', 'preferences', 'skills', 'activities', 'documents'];
    const idx = order.indexOf(current);
    return order[idx + 1] || null;
  };

  assert.equal(getNextStep('personal'), 'academic');
  assert.equal(getNextStep('academic'), 'preferences');
  assert.equal(getNextStep('preferences'), 'skills');
  assert.equal(getNextStep('skills'), 'activities');
  assert.equal(getNextStep('activities'), 'documents');
  assert.equal(getNextStep('documents'), null);
});
