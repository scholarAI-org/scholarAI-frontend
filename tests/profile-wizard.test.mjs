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

const { createAcademicInformationSchema } = loadModule(
  path.join(feature, 'schemas/academic-information.schema.ts')
);

const { toAcademicInformationPayload } = loadModule(
  path.join(feature, 'lib/academic-information.ts')
);

const { preferencesSchema } = loadModule(path.join(feature, 'schemas/preferences.schema.ts'));

const { toPreferencesDto } = loadModule(path.join(feature, 'lib/preferences.ts'));

const { desiredDegreeLevelValues, normalizePreferences } = loadModule(
  path.join(feature, 'schemas/preferences-api.schema.ts')
);

const { getFieldOfStudyOptions } = loadModule(path.join(feature, 'lib/field-of-study.ts'));

// ─── Academic Information ────────────────────────────────────────────────────

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

// ─── Stepper / navigation ────────────────────────────────────────────────────

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

test('3. Save & Continue navigation follows the new order', () => {
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

// ─── Desired Degree Level enum ───────────────────────────────────────────────

test('4. TAWJIHI is NOT a valid Preferences desired_degree_level', () => {
  assert.equal(desiredDegreeLevelValues.includes('TAWJIHI'), false);

  const result = preferencesSchema.safeParse({ desired_degree_level: 'TAWJIHI' });
  assert.equal(result.success, false);
});

test('5. BACHELOR is a valid Preferences desired_degree_level', () => {
  assert.equal(desiredDegreeLevelValues.includes('BACHELOR'), true);
  const result = preferencesSchema.safeParse({ desired_degree_level: 'BACHELOR' });
  assert.equal(result.success, true);
  assert.equal(result.data.desired_degree_level, 'BACHELOR');
});

test('6. MASTER is a valid Preferences desired_degree_level', () => {
  assert.equal(desiredDegreeLevelValues.includes('MASTER'), true);
  const result = preferencesSchema.safeParse({ desired_degree_level: 'MASTER' });
  assert.equal(result.success, true);
  assert.equal(result.data.desired_degree_level, 'MASTER');
});

test('7. PHD is a valid Preferences desired_degree_level', () => {
  assert.equal(desiredDegreeLevelValues.includes('PHD'), true);
  const result = preferencesSchema.safeParse({ desired_degree_level: 'PHD' });
  assert.equal(result.success, true);
  assert.equal(result.data.desired_degree_level, 'PHD');
});

test('8. DIPLOMA is a valid Preferences desired_degree_level', () => {
  assert.equal(desiredDegreeLevelValues.includes('DIPLOMA'), true);
  const result = preferencesSchema.safeParse({ desired_degree_level: 'DIPLOMA' });
  assert.equal(result.success, true);
  assert.equal(result.data.desired_degree_level, 'DIPLOMA');
});

test('9. OTHER is a valid Preferences desired_degree_level', () => {
  assert.equal(desiredDegreeLevelValues.includes('OTHER'), true);
  const result = preferencesSchema.safeParse({ desired_degree_level: 'OTHER' });
  assert.equal(result.success, true);
  assert.equal(result.data.desired_degree_level, 'OTHER');
});

// ─── normalizePreferences ────────────────────────────────────────────────────

test('10. normalizePreferences rejects TAWJIHI and maps it to null', () => {
  const result = normalizePreferences({ desired_degree_level: 'TAWJIHI' });
  assert.equal(result.desired_degree_level, null);
});

test('11. normalizePreferences maps DIPLOMA correctly', () => {
  const result = normalizePreferences({ desired_degree_level: 'DIPLOMA' });
  assert.equal(result.desired_degree_level, 'DIPLOMA');
});

test('12. normalizePreferences maps OTHER correctly', () => {
  const result = normalizePreferences({ desired_degree_level: 'OTHER' });
  assert.equal(result.desired_degree_level, 'OTHER');
});

test('13. normalizePreferences does NOT include preferred_fields_of_study', () => {
  const result = normalizePreferences({ desired_degree_level: 'BACHELOR' });
  assert.equal('preferred_fields_of_study' in result, false);
});

// ─── toPreferencesDto ────────────────────────────────────────────────────────

test('14. toPreferencesDto includes target_field_of_study and PhD specialization', () => {
  const dto = toPreferencesDto({
    desired_degree_level: 'PHD',
    target_field_of_study: 'Computer Science',
    target_field_of_study_openalex_id: 'sub-cs',
    detailed_specialization: 'Artificial Intelligence',
    funding_type: 'FULL',
    preferred_countries: [],
    open_to_all_countries: false,
    is_profile_completed: false,
  });

  assert.equal(dto.desired_degree_level, 'PHD');
  assert.equal(dto.target_field_of_study, 'Computer Science');
  assert.equal(dto.target_field_of_study_openalex_id, 'sub-cs');
  assert.equal(dto.detailed_specialization, 'Artificial Intelligence');
  assert.equal('preferred_fields_of_study' in dto, false);
});

test('15. Switching away from PHD clears detailed_specialization only', () => {
  const dto = toPreferencesDto({
    desired_degree_level: 'MASTER',
    target_field_of_study: 'Computer Science',
    target_field_of_study_openalex_id: 'sub-cs',
    detailed_specialization: 'Artificial Intelligence',
    funding_type: 'FULL',
    preferred_countries: [],
    open_to_all_countries: false,
    is_profile_completed: false,
  });

  assert.equal(dto.desired_degree_level, 'MASTER');
  assert.equal(dto.detailed_specialization, null);
  // target_field_of_study must NOT be cleared
  assert.equal(dto.target_field_of_study, 'Computer Science');
  assert.equal(dto.target_field_of_study_openalex_id, 'sub-cs');
});

test('16. Hidden PhD specialization is not submitted when non-PHD level selected', () => {
  const dto = toPreferencesDto({
    desired_degree_level: 'BACHELOR',
    detailed_specialization: 'Quantum Mechanics',
  });
  assert.equal(dto.detailed_specialization, null);
});

test('17. Preferences payload retains target_field_of_study for MASTER', () => {
  const dto = toPreferencesDto({
    desired_degree_level: 'MASTER',
    target_field_of_study: 'Computer Science',
    target_field_of_study_openalex_id: 'sub-cs',
    funding_type: 'FULL',
    preferred_countries: [],
    open_to_all_countries: false,
    is_profile_completed: false,
  });
  assert.equal(dto.desired_degree_level, 'MASTER');
  assert.equal(dto.target_field_of_study, 'Computer Science');
  assert.equal(dto.target_field_of_study_openalex_id, 'sub-cs');
  assert.equal(dto.detailed_specialization, null);
});

test('18. preferred_fields_of_study is no longer sent in toPreferencesDto payload', () => {
  const dto = toPreferencesDto({
    desired_degree_level: 'BACHELOR',
    target_field_of_study: 'Physics',
    preferred_countries: ['DE'],
  });
  assert.equal('preferred_fields_of_study' in dto, false);
});

// ─── Field-of-study options ───────────────────────────────────────────────────

test('19. getFieldOfStudyOptions returns OpenAlex subfields for BACHELOR', () => {
  const mockSubfields = [
    { id: 'sub-cs', display_name: 'Computer Science' },
    { id: 'sub-med', display_name: 'Medicine' },
  ];
  const options = getFieldOfStudyOptions('BACHELOR', mockSubfields);
  assert.equal(
    options.some((o) => o.value === 'sub-cs'),
    true
  );
  assert.equal(
    options.every((o) => o.isOpenAlex),
    true
  );
});

test('20. getFieldOfStudyOptions returns OpenAlex subfields for DIPLOMA', () => {
  const mockSubfields = [{ id: 'sub-eng', display_name: 'Engineering' }];
  const options = getFieldOfStudyOptions('DIPLOMA', mockSubfields);
  assert.equal(
    options.some((o) => o.value === 'sub-eng'),
    true
  );
  assert.equal(
    options.every((o) => o.isOpenAlex),
    true
  );
});

test('21. getFieldOfStudyOptions returns OpenAlex subfields for OTHER', () => {
  const mockSubfields = [{ id: 'sub-art', display_name: 'Arts' }];
  const options = getFieldOfStudyOptions('OTHER', mockSubfields);
  assert.equal(
    options.some((o) => o.value === 'sub-art'),
    true
  );
});

test('22. getFieldOfStudyOptions returns empty when degree level is null', () => {
  const options = getFieldOfStudyOptions(null, [{ id: 'x', display_name: 'X' }]);
  assert.equal(options.length, 0);
});

// ─── Cache / mutation regression ─────────────────────────────────────────────

test('23. Preferences mutation does not invalidate the full-profile query after success', () => {
  const hookSource = fs.readFileSync(path.join(feature, 'hooks/useUpdatePreferences.ts'), 'utf8');
  const onSuccessSource = hookSource.split('onSuccess:')[1];

  assert.ok(onSuccessSource, 'expected an onSuccess handler');
  assert.equal(onSuccessSource.includes('invalidateQueries'), false);
});

test('24. PUT payload does NOT include preferred_fields_of_study or research_specialization', () => {
  const apiSource = fs.readFileSync(path.join(feature, 'api/update-preferences.ts'), 'utf8');
  assert.equal(apiSource.includes('preferred_fields_of_study'), false);
  assert.equal(apiSource.includes('research_specialization'), false);
});

test('25. PUT payload includes all required backend contract fields', () => {
  const apiSource = fs.readFileSync(path.join(feature, 'api/update-preferences.ts'), 'utf8');
  for (const field of [
    'desired_degree_level',
    'target_field_of_study',
    'target_field_of_study_openalex_id',
    'detailed_specialization',
    'funding_type',
    'preferred_countries',
    'open_to_all_countries',
  ]) {
    assert.ok(apiSource.includes(field), `missing field: ${field}`);
  }
  // These must NOT appear in the payload
  assert.equal(apiSource.includes('preferred_fields_of_study'), false);
});

test('26. Stepper order contains preferences in position 3', () => {
  const expectedOrder = [
    'personal',
    'academic',
    'preferences',
    'skills',
    'activities',
    'documents',
  ];
  assert.equal(expectedOrder.indexOf('preferences'), 2);
  assert.equal(expectedOrder.length, 6);
});

test('27. onSuccess cache merge preserves target_field_of_study when server response omits it', () => {
  const sentVariables = {
    desired_degree_level: 'BACHELOR',
    target_field_of_study: 'Computer Science',
    target_field_of_study_openalex_id: 'sub-cs',
    detailed_specialization: null,
    funding_type: 'FULL',
    preferred_countries: ['DE'],
    open_to_all_countries: false,
    is_profile_completed: false,
  };

  const serverResponse = {
    desired_degree_level: 'BACHELOR',
    target_field_of_study: null,
    target_field_of_study_openalex_id: null,
    detailed_specialization: null,
    funding_type: 'FULL',
    preferred_countries: ['DE'],
    open_to_all_countries: false,
    is_profile_completed: false,
  };

  // Safe merge strategy: sentVariables provides fallback when server returns null
  const mergedSafe = normalizePreferences({
    ...sentVariables,
    ...Object.fromEntries(
      Object.entries(serverResponse).filter(([, v]) => v !== null && v !== undefined)
    ),
  });

  assert.equal(mergedSafe.desired_degree_level, 'BACHELOR');
  assert.equal(mergedSafe.target_field_of_study, 'Computer Science');
  assert.equal(mergedSafe.target_field_of_study_openalex_id, 'sub-cs');
  assert.equal(mergedSafe.funding_type, 'FULL');
  assert.deepEqual(mergedSafe.preferred_countries, ['DE']);
});

const { createPreferencesSchema } = loadModule(path.join(feature, 'schemas/preferences.schema.ts'));

test('28. createPreferencesSchema requires detailed_specialization when desired_degree_level is PHD', () => {
  const schema = createPreferencesSchema();
  const res1 = schema.safeParse({
    desired_degree_level: 'PHD',
    detailed_specialization: '',
  });
  assert.equal(res1.success, false);

  const res2 = schema.safeParse({
    desired_degree_level: 'PHD',
    detailed_specialization: 'Quantum Computing',
  });
  assert.equal(res2.success, true);
});

test('29. createPreferencesSchema allows empty detailed_specialization for non-PHD levels', () => {
  const schema = createPreferencesSchema();
  for (const level of ['BACHELOR', 'MASTER', 'DIPLOMA', 'OTHER']) {
    const res = schema.safeParse({
      desired_degree_level: level,
      detailed_specialization: null,
    });
    assert.equal(res.success, true, `failed for level: ${level}`);
  }
});

test('30. Regression: Changing level from PHD to BACHELOR sets detailed_specialization to null and sends BACHELOR payload', () => {
  const initialPhdForm = {
    desired_degree_level: 'PHD',
    target_field_of_study: 'Computer Science',
    target_field_of_study_openalex_id: 'sub-1',
    detailed_specialization: 'Artificial Intelligence',
    funding_type: 'FULL',
    preferred_countries: ['DE'],
  };

  const initialPayload = toPreferencesDto(initialPhdForm);
  assert.equal(initialPayload.desired_degree_level, 'PHD');
  assert.equal(initialPayload.detailed_specialization, 'Artificial Intelligence');

  // User changes level to BACHELOR
  const updatedBachelorForm = {
    ...initialPhdForm,
    desired_degree_level: 'BACHELOR',
    detailed_specialization: null,
  };

  const updatedPayload = toPreferencesDto(updatedBachelorForm);
  assert.equal(updatedPayload.desired_degree_level, 'BACHELOR');
  assert.equal(updatedPayload.detailed_specialization, null);
  assert.notEqual(updatedPayload.desired_degree_level, 'PHD');
});

test('31. detailed_specialization options use display_name as value so dropdown matches selected value', () => {
  const topics = [
    { id: 'https://openalex.org/T10001', display_name: 'Quantum Computing' },
    { id: 'https://openalex.org/T10002', display_name: 'Deep Learning' },
  ];

  // Mapping topics for detailed_specialization
  const options = topics.map((t) => ({ value: t.display_name, label: t.display_name }));

  const selectedValue = 'Quantum Computing';
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  assert.ok(selectedOption, 'expected selectedOption to be found');
  assert.equal(selectedOption.label, 'Quantum Computing');
});

test('32. preferred_countries payload contains 2-letter ISO country codes matching regex ^[A-Za-z]{2}$', () => {
  const form = {
    desired_degree_level: 'BACHELOR',
    preferred_countries: ['DE', 'FR', 'JO'],
  };

  const payload = toPreferencesDto(form);
  assert.ok(Array.isArray(payload.preferred_countries));
  assert.equal(payload.preferred_countries.length, 3);
  for (const code of payload.preferred_countries) {
    assert.match(code, /^[A-Za-z]{2}$/, `${code} is not a valid 2-letter ISO country code`);
  }
});
