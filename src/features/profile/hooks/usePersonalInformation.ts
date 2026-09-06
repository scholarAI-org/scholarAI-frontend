import { useProfile } from './useProfile';

export function usePersonalInformation() {
  const { data, ...rest } = useProfile();
  return {
    ...rest,
    data: data.personal,
  };
}
