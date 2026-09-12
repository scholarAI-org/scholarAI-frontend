import * as z from 'zod';

export const RESET_PASSWORD_MIN_LENGTH = 8;
export const RESET_PASSWORD_SPECIAL_CHARACTERS = '!@#$%^&*(),.?":{}|<>';

const digitPattern = /\d/;
const specialCharacterPattern = /[!@#$%^&*(),.?":{}|<>]/;

export function createResetPasswordValueSchema(t: (key: string) => string) {
  return z
    .string()
    .min(RESET_PASSWORD_MIN_LENGTH, { message: t('passwordMin') })
    .regex(digitPattern, { message: t('passwordDigit') })
    .regex(specialCharacterPattern, { message: t('passwordSpecial') });
}
