import { generateKeyPairSync, sign, verify, createPrivateKey, createPublicKey, KeyObject } from 'crypto';

/**
 * Ed25519 cryptographic operations for event signing and verification.
 * Uses Node.js built-in crypto module (no external dependencies).
 */

export interface KeyPair {
  publicKey: string;  // Base64url encoded
  privateKey: string; // Base64url encoded
}

/**
 * Generates a new Ed25519 key pair
 * @returns Object containing base64url-encoded public and private keys
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  return {
    publicKey: publicKey.toString('base64url'),
    privateKey: privateKey.toString('base64url')
  };
}

/**
 * Signs data using Ed25519 private key
 * @param data - Data to sign (string or Buffer)
 * @param privateKeyBase64url - Base64url-encoded private key
 * @returns Base64url-encoded signature
 */
export function signData(data: string | Buffer, privateKeyBase64url: string): string {
  const privateKeyBuffer = Buffer.from(privateKeyBase64url, 'base64url');

  const key = createPrivateKey({
    key: privateKeyBuffer,
    format: 'der',
    type: 'pkcs8'
  });

  const signature = sign(null, Buffer.from(data), key);
  return signature.toString('base64url');
}

/**
 * Verifies Ed25519 signature
 * @param data - Original data that was signed
 * @param signatureBase64url - Base64url-encoded signature
 * @param publicKeyBase64url - Base64url-encoded public key
 * @returns true if signature is valid, false otherwise
 */
export function verifySignature(
  data: string | Buffer,
  signatureBase64url: string,
  publicKeyBase64url: string
): boolean {
  try {
    const publicKeyBuffer = Buffer.from(publicKeyBase64url, 'base64url');
    const signatureBuffer = Buffer.from(signatureBase64url, 'base64url');

    const key = createPublicKey({
      key: publicKeyBuffer,
      format: 'der',
      type: 'spki'
    });

    return verify(null, Buffer.from(data), key, signatureBuffer);
  } catch {
    return false;
  }
}