/**
 * Generates a unique ID for local database records.
 * This mimics the structure of CUIDs used in the backend Prisma schema.
 * It combines a timestamp with random characters to ensure uniqueness.
 */
export const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  // 'm' prefix for mobile-generated to distinguish if needed
  return `m${timestamp}${randomPart}`;
};
