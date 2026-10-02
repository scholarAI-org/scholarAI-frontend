// Toggle one checkbox value, keeping the existing order.
export const toggleValue = <T extends string>(values: readonly T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

// Countries shown in the filter: the backend options as returned, followed by any
// selected value (from the URL) that is not among them, so it can still be removed.
// Exact string matching; values are never trimmed, mapped or translated.
export const mergeCountryOptions = (options: readonly string[], selected: readonly string[]) => [
  ...new Set([...options, ...selected]),
];
