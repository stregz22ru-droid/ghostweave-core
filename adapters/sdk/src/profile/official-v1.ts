// GHOSTWEAVE SDK: Official Profile v1.0
// Встроенный профиль для SDK

import { Profile } from "../types/index";

/**
 * Official Profile v1.0
 * 
 * Алгоритмы:
 * - Hash: SHA-256 (FIPS 180-4)
 * - Canonicalization: RFC 8785
 * - Signature: Ed25519 (RFC 8032)
 * - Identity: Implementation-defined
 * - Anchor: NONE
 */
export const officialProfileV1: Profile = {
  id: "ghostweave-profile-v1",
  version: "1.0.0",
  
  algorithms: {
    hash: "SHA-256",
    canonicalization: "RFC 8785",
    signature: "Ed25519"
  },

  identity: {
    provider: "implementation-defined",
    mechanism: "implementation-defined"
  },

  anchor: {
    provider: null,
    mechanism: null
  }
};

/**
 * Проверка, является ли профиль официальным v1.0
 */
export function isOfficialProfileV1(profile: Profile): boolean {
  return profile.id === "ghostweave-profile-v1" && profile.version === "1.0.0";
}

/**
 * Получение рекомендуемых параметров профиля
 */
export function getProfileRecommendations(): {
  hashAlgorithm: string;
  canonicalization: string;
  signatureAlgorithm: string;
  identityProvider: string;
  anchorProvider: string | null;
} {
  return {
    hashAlgorithm: officialProfileV1.algorithms.hash,
    canonicalization: officialProfileV1.algorithms.canonicalization,
    signatureAlgorithm: officialProfileV1.algorithms.signature,
    identityProvider: officialProfileV1.identity.provider,
    anchorProvider: officialProfileV1.anchor.provider
  };
}

export default officialProfileV1;