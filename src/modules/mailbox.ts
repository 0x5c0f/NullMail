export const SHORTID_MIN_LENGTH = 3;
export const SHORTID_MAX_LENGTH = 20;
export const SHORTID_PATTERN = new RegExp(`^[a-z0-9]{${SHORTID_MIN_LENGTH},${SHORTID_MAX_LENGTH}}$`);

export function normalizeShortid(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidShortid(value: string): boolean {
  return SHORTID_PATTERN.test(normalizeShortid(value));
}
