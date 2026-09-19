import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import type { ManualScholarshipFormValues } from '../schemas/manual-scholarship.schema';
import { ManualScholarshipField } from './ManualScholarshipField';

type Props = {
  register: UseFormRegister<ManualScholarshipFormValues>;
  errors: FieldErrors<ManualScholarshipFormValues>;
  noDeadline: boolean;
  setValue: UseFormSetValue<ManualScholarshipFormValues>;
};

export function ManualScholarshipBasicFields({ register, errors, noDeadline, setValue }: Props) {
  const t = useTranslations('AdminManualScholarship');
  const optional = t('optional');

  return (
    <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
      <ManualScholarshipField
        name="title_ar"
        label={t('fields.titleAr')}
        required
        errorMessage={errors.title_ar?.message}
      >
        {(props) => (
          <Input
            {...register('title_ar')}
            {...props}
            required
            dir="rtl"
            placeholder={t('placeholders.titleAr')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="title_en"
        label={t('fields.titleEn')}
        required
        errorMessage={errors.title_en?.message}
      >
        {(props) => (
          <Input
            {...register('title_en')}
            {...props}
            required
            dir="ltr"
            placeholder={t('placeholders.titleEn')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="organization_name"
        label={t('fields.organizationName')}
        required
        errorMessage={errors.organization_name?.message}
      >
        {(props) => (
          <Input
            {...register('organization_name')}
            {...props}
            required
            placeholder={t('placeholders.organizationName')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="country"
        label={t('fields.country')}
        required
        errorMessage={errors.country?.message}
      >
        {(props) => (
          <Input
            {...register('country')}
            {...props}
            required
            placeholder={t('placeholders.country')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="university_name"
        label={t('fields.universityName')}
        optionalLabel={optional}
        errorMessage={errors.university_name?.message}
      >
        {(props) => (
          <Input
            {...register('university_name')}
            {...props}
            placeholder={t('placeholders.universityName')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="study_level"
        label={t('fields.studyLevel')}
        required
        errorMessage={errors.study_level?.message}
      >
        {(props) => (
          <Input
            {...register('study_level')}
            {...props}
            required
            placeholder={t('placeholders.studyLevel')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="funding_type"
        label={t('fields.fundingType')}
        required
        errorMessage={errors.funding_type?.message}
      >
        {(props) => (
          <Input
            {...register('funding_type')}
            {...props}
            required
            placeholder={t('placeholders.fundingType')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="funding_amount"
        label={t('fields.fundingAmount')}
        optionalLabel={optional}
        errorMessage={errors.funding_amount?.message}
      >
        {(props) => (
          <Input
            {...register('funding_amount')}
            {...props}
            placeholder={t('placeholders.fundingAmount')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="deadline"
        label={t('fields.deadline')}
        required={!noDeadline}
        errorMessage={errors.deadline?.message}
      >
        {(props) => (
          <Input
            {...register('deadline')}
            {...props}
            type="date"
            required={!noDeadline}
            disabled={noDeadline}
          />
        )}
      </ManualScholarshipField>
      <div className="flex items-center pb-2">
        <Checkbox
          {...register('no_deadline', {
            onChange: (event) => {
              if (event.target.checked) {
                setValue('deadline', '', { shouldDirty: true, shouldValidate: true });
              }
            },
          })}
          label={t('fields.noDeadline')}
        />
      </div>
      <ManualScholarshipField
        name="apply_link"
        label={t('fields.applyLink')}
        required
        errorMessage={errors.apply_link?.message}
      >
        {(props) => (
          <Input
            {...register('apply_link')}
            {...props}
            type="url"
            required
            placeholder={t('placeholders.applyLink')}
          />
        )}
      </ManualScholarshipField>
      <ManualScholarshipField
        name="image_url"
        label={t('fields.imageUrl')}
        required
        errorMessage={errors.image_url?.message}
      >
        {(props) => (
          <Input
            {...register('image_url')}
            {...props}
            type="url"
            required
            placeholder={t('placeholders.imageUrl')}
          />
        )}
      </ManualScholarshipField>
    </div>
  );
}
