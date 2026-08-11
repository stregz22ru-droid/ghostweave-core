/**
 * Canonical JSON serialization for deterministic hashing.
 * Ensures identical objects produce identical JSON strings.
 */

/**
 * Recursively sorts object keys alphabetically
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sorted: any = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  
  return sorted;
}

/**
 * Serializes object to canonical JSON format:
 * - Keys sorted alphabetically
 * - No whitespace
 * - Deterministic output
 * 
 * @param obj - Object to serialize
 * @returns Canonical JSON string
 */
export function canonicalJson(obj: any): string {
  const sorted = sortObjectKeys(obj);
  return JSON.stringify(sorted);
}