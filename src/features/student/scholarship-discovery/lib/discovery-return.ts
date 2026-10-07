export const DISCOVERY_PATH = '/student/scholarships';

// The last discovery URL the student saw, kept in module memory only: it
// survives client-side navigation to a details page and is gone after a reload.
// No localStorage or sessionStorage.
let rememberedSearch: string | null = null;

export function rememberDiscoverySearch(search: string) {
  rememberedSearch = search;
}

export const getRememberedDiscoverySearch = () => rememberedSearch;

export function forgetDiscoverySearch() {
  rememberedSearch = null;
}

// Back link target: the discovery route with exactly the remembered query
// (re-encoded, so it can only ever be a query string), or the plain route.
export function getDiscoveryReturnHref(search: string | null) {
  const params = new URLSearchParams(search ?? '');
  // Preserve the visited query, excluding presentation and API-only parameters.
  for (const key of [...params.keys()]) {
    if (
      ![
        'search',
        'academic_level',
        'funding_type',
        'opportunity_type',
        'country',
        'sort',
        'page',
      ].includes(key)
    )
      params.delete(key);
  }
  const query = params.toString();
  return query ? `${DISCOVERY_PATH}?${query}` : DISCOVERY_PATH;
}
