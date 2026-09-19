export function toDetailValues(value: string[] | string | null | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((item) => item.trim())
    : value?.trim()
      ? [value.trim()]
      : [];
}

export function isValidRejectionReason(value: string): boolean {
  return value.trim().length >= 3;
}

export function getFundingValues(
  fundingType: string | null | undefined,
  fundingAmount: string | null | undefined
): string[] {
  return [fundingType?.trim(), fundingAmount?.trim()].filter((value): value is string =>
    Boolean(value)
  );
}
