import { HOME_SECTION_IDS, type HomeSectionId } from './home-sections';

// SERVER ONLY. Call from Server Components (src/app/**) and pass the result down
// as props; never import this from a client component (guarded by a test).
//
// Demo data is allowed only in local development: never in a production build,
// never on Vercel Production or Preview, and only for the sections that
// HOME_MOCK_SECTIONS lists. Unset or blank means no demo data at all.
export function resolveHomeMockSections(
  env: Readonly<Record<string, string | undefined>>
): HomeSectionId[] {
  if (env.NODE_ENV === 'production') return [];
  if (env.VERCEL_ENV === 'production' || env.VERCEL_ENV === 'preview') return [];
  const raw = env.HOME_MOCK_SECTIONS;
  if (!raw || !raw.trim()) return [];

  const sections: HomeSectionId[] = [];
  for (const part of raw.split(',')) {
    const name = part.trim().toLowerCase();
    const known = HOME_SECTION_IDS.find((id) => id === name);
    if (known && !sections.includes(known)) sections.push(known);
  }
  return sections;
}
