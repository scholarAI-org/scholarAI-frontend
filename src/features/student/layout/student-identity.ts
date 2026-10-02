interface StudentIdentitySource {
  name?: string | null;
  email?: string | null;
}

export const getStudentDisplayName = (user: StudentIdentitySource | null, fallback: string) =>
  user?.name?.trim() || user?.email?.trim() || fallback;

export const getStudentInitial = (displayName: string) =>
  displayName.trim().charAt(0).toLocaleUpperCase() || '?';
