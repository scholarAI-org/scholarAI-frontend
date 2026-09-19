import { z } from 'zod';

export type ManualScholarshipValidationMessages = {
  required: string;
  invalidHttpUrl: string;
  deadlineRequired: string;
  invalidDeadline: string;
};

const httpUrlPattern = /^https?:\/\//i;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string) {
  if (!isoDatePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function requiredText(message: string) {
  return z.string().trim().min(1, { message });
}

function optionalText() {
  return z.string().optional();
}

function httpUrl(message: string, required: boolean) {
  const schema = required ? z.string().trim() : z.string().trim().optional();

  return schema.superRefine((value, ctx) => {
    if (!value) {
      if (required) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
      return;
    }

    if (!httpUrlPattern.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      return;
    }

    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  });
}

export function createManualScholarshipSchema(messages: ManualScholarshipValidationMessages) {
  return z
    .object({
      title_ar: requiredText(messages.required),
      title_en: requiredText(messages.required),
      organization_name: requiredText(messages.required),
      country: requiredText(messages.required),
      university_name: optionalText(),
      study_level: requiredText(messages.required),
      funding_type: requiredText(messages.required),
      funding_amount: optionalText(),
      deadline: z.string().optional(),
      no_deadline: z.boolean(),
      majors: optionalText(),
      language_requirements: optionalText(),
      eligibility_criteria: optionalText(),
      required_documents: optionalText(),
      apply_link: httpUrl(messages.invalidHttpUrl, true),
      image_url: httpUrl(messages.invalidHttpUrl, true),
      source_url: httpUrl(messages.invalidHttpUrl, false),
      description_html: optionalText(),
      apply_email: optionalText(),
      apply_phone: optionalText(),
    })
    .superRefine(({ deadline, no_deadline }, ctx) => {
      if (no_deadline) {
        return;
      }

      const value = deadline?.trim() ?? '';
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['deadline'],
          message: messages.deadlineRequired,
        });
        return;
      }

      if (!isValidIsoDate(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['deadline'],
          message: messages.invalidDeadline,
        });
      }
    });
}

export type ManualScholarshipFormValues = z.infer<ReturnType<typeof createManualScholarshipSchema>>;
