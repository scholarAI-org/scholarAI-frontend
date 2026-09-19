import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import type { ManualScholarshipFormValues } from '../schemas/manual-scholarship.schema';
import { ManualScholarshipField } from './ManualScholarshipField';

type Props = {
  register: UseFormRegister<ManualScholarshipFormValues>;
  errors: FieldErrors<ManualScholarshipFormValues>;
};

const textareaClassName =
  'min-h-32 w-full resize-y rounded-[var(--radius-input)] border border-[var(--color-border-default)] bg-white px-4 py-3 text-sm text-[var(--color-text-label)] outline-none transition-colors placeholder:text-[#979797] focus:border-[var(--color-border-focus)] aria-[invalid=true]:border-[var(--color-border-error)]';

export function ManualScholarshipDetailsFields({ register, errors }: Props) {
  const t = useTranslations('AdminManualScholarship');
  const optional = t('optional');
  const multiline = t('placeholders.multiline');

  const arrayField = (
    name: 'majors' | 'language_requirements' | 'eligibility_criteria' | 'required_documents',
    label: string
  ) => (
    <ManualScholarshipField
      name={name}
      label={label}
      optionalLabel={optional}
      helperText={multiline}
      errorMessage={errors[name]?.message}
    >
      {(props) => (
        <textarea
          {...register(name)}
          {...props}
          placeholder={multiline}
          className={textareaClassName}
        />
      )}
    </ManualScholarshipField>
  );

  return (
    <div className="mt-8 grid gap-x-6 gap-y-6 border-t border-[#e2e8f0] pt-8 md:grid-cols-2">
      {arrayField('majors', t('fields.majors'))}
      {arrayField('language_requirements', t('fields.languageRequirements'))}
      {arrayField('eligibility_criteria', t('fields.eligibilityCriteria'))}
      {arrayField('required_documents', t('fields.requiredDocuments'))}
      <ManualScholarshipField
        name="description_html"
        label={t('fields.descriptionHtml')}
        optionalLabel={optional}
        errorMessage={errors.description_html?.message}
      >
        {(props) => (
          <textarea
            {...register('description_html')}
            {...props}
            placeholder={t('placeholders.descriptionHtml')}
            className={textareaClassName}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="source_url"
        label={t('fields.sourceUrl')}
        optionalLabel={optional}
        errorMessage={errors.source_url?.message}
      >
        {(props) => (
          <Input
            {...register('source_url')}
            {...props}
            type="url"
            placeholder={t('placeholders.sourceUrl')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="apply_email"
        label={t('fields.applyEmail')}
        optionalLabel={optional}
        errorMessage={errors.apply_email?.message}
      >
        {(props) => (
          <Input
            {...register('apply_email')}
            {...props}
            type="email"
            placeholder={t('placeholders.applyEmail')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="apply_phone"
        label={t('fields.applyPhone')}
        optionalLabel={optional}
        errorMessage={errors.apply_phone?.message}
      >
        {(props) => (
          <Input
            {...register('apply_phone')}
            {...props}
            type="tel"
            placeholder={t('placeholders.applyPhone')}
          />
        )}
      </ManualScholarshipField>
    </div>
  );
}
