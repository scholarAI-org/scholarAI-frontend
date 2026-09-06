import { useProfile } from './useProfile';

export function useAcademicInformation() {
  const { data, ...rest } = useProfile();
  return {
    ...rest,
    data: data.academic,
  };
}
