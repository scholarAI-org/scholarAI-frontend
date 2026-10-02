// Toggle one checkbox value, keeping the existing order.
export const toggleValue = <T extends string>(values: readonly T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
