import { useProfile } from './useProfile';

export function usePreferences() {
  const { data, ...rest } = useProfile();
  return {
    ...rest,
    data: data.preferences,
  };
}
