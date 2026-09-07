export interface OpenAlexEntity {
  id: string;
  display_name: string;
}

export interface OpenAlexResponse {
  results: OpenAlexEntity[];
}

const OPENALEX_API_BASE = 'https://api.openalex.org';

export async function fetchOpenAlexSubfields(): Promise<OpenAlexEntity[]> {
  const url = `${OPENALEX_API_BASE}/subfields?per-page=200`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch OpenAlex subfields');
  }

  const data = await response.json();
  let results: OpenAlexEntity[] = data.results;

  // If there are more pages, let's fetch one more just in case to cover >200 (there are ~300)
  if (data.meta && data.meta.count > 200) {
    const response2 = await fetch(`${OPENALEX_API_BASE}/subfields?per-page=200&page=2`);
    if (response2.ok) {
      const data2 = await response2.json();
      results = results.concat(data2.results);
    }
  }

  return results.sort((a, b) => a.display_name.localeCompare(b.display_name));
}

export async function fetchOpenAlexTopics(subfieldId?: string): Promise<OpenAlexEntity[]> {
  let query = '?per-page=200';
  if (subfieldId) {
    const rawId = subfieldId.split('/').pop();
    query += `&filter=subfield.id:${rawId}`;
  }

  const url = `${OPENALEX_API_BASE}/topics${query}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch OpenAlex topics');
  }

  const data = await response.json();
  return data.results.sort((a: OpenAlexEntity, b: OpenAlexEntity) =>
    a.display_name.localeCompare(b.display_name)
  );
}
