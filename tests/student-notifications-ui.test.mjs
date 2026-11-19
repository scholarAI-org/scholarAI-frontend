import assert from 'node:assert/strict';
import { test } from 'node:test';
import { React, env, messages, render } from './helpers/notifications-harness.mjs';

// Feature 011: Student Notifications. Rendered markup, shell wiring, states, 390px structure,
// i18n and guards. Pure logic and the adapter are in student-notifications.test.mjs.

test('harness: the stubs render a translated element in both locales', () => {
  env.locale = 'en';
  assert.ok(messages.en.StudentLayout);
  assert.equal(render(React.createElement('p', null, 'x'), 'en'), '<p>x</p>');
  assert.equal(render(React.createElement('p', null, 'x'), 'ar'), '<p>x</p>');
});
