import { randomUUID } from 'node:crypto';

/**
 * Regex matching canonical UUID format (8-4-4-4-12 hex characters)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether a given string is a valid EVP key (PIX random key / UUID).
 * @param {string} key - The PIX EVP key to validate.
 * @returns {boolean} True if key is a valid EVP key format, false otherwise.
 */
export function validateEVP(key) {
  if (typeof key !== 'string') {
    return false;
  }
  const trimmed = key.trim();
  return UUID_REGEX.test(trimmed);
}

/**
 * Generates a new random EVP key (UUID v4).
 * @returns {string} A canonical lowercase UUID string.
 */
export function generateEVP() {
  return randomUUID();
}

/**
 * Formats a given EVP key to canonical lowercase UUID format.
 * @param {string} key - The PIX EVP key to format.
 * @returns {string|null} Formatted EVP key string, or null if key is invalid.
 */
export function formatEVP(key) {
  if (!validateEVP(key)) {
    return null;
  }
  return key.trim().toLowerCase();
}
