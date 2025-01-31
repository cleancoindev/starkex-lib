/**
 * Helper functions for converting keys and signatures between formats.
 */

import elliptic from 'elliptic';

import { starkEc } from '../lib/starkex-resources';
import {
  bnToHex32,
  normalizeHex32,
} from '../lib/util';
import {
  KeyPair,
  SignatureStruct,
} from '../types';

/**
 * Helper for if you want to access additional cryptographic functionality with a private key.
 *
 * Accepts a private key or key pair as hex strings (with or without 0x prefix).
 */
export function asEcKeyPair(
  privateKeyOrKeyPair: string | KeyPair,
): elliptic.ec.KeyPair {
  const privateKey: string = typeof privateKeyOrKeyPair === 'string'
    ? privateKeyOrKeyPair
    : privateKeyOrKeyPair.privateKey;
  return starkEc.keyFromPrivate(normalizeHex32(privateKey));
}

/**
 * Helper for if you want to access additional cryptographic functionality with a public key.
 *
 * The provided parameter should be the x-coordinate of the public key as a hex string. There are
 * two possible values for the y-coordinate, so `isOdd` is required to choose between the two.
 */
export function asEcKeyPairPublic(
  publicKey: string,
  isOdd: boolean,
): elliptic.ec.KeyPair {
  const prefix = isOdd ? '03' : '02';
  const prefixedPublicKey = `${prefix}${normalizeHex32(publicKey)}`;

  // This will get the point from only the x-coordinate via:
  // https://github.com/indutny/elliptic/blob/e71b2d9359c5fe9437fbf46f1f05096de447de57/dist/elliptic.js#L1205
  //
  // See also how Starkware infers the y-coordinate:
  // https://github.com/starkware-libs/starkex-resources/blob/1eb84c6a9069950026768013f748016d3bd51d54/crypto/starkware/crypto/signature/signature.py#L164-L173
  return starkEc.keyFromPublic(prefixedPublicKey, 'hex');
}

/**
 * Converts an `elliptic` KeyPair object to a simple object with publicKey & privateKey hex strings.
 *
 * Returns hex strings without 0x prefix.
 */
export function asSimpleKeyPair(
  ecKeyPair: elliptic.ec.KeyPair,
): KeyPair {
  const ecPrivateKey = ecKeyPair.getPrivate();
  if (!ecPrivateKey) {
    throw new Error('asSimpleKeyPair: Key pair has no private key');
  }
  const ecPublicKey = ecKeyPair.getPublic();
  return {
    publicKey: asSimplePublicKey(ecPublicKey),
    privateKey: bnToHex32(ecPrivateKey),
  };
}

/**
 * Converts an `elliptic` BasePoint object to a compressed representation: the x-coordinate as hex.
 *
 * Returns a hex string without 0x prefix.
 */
export function asSimplePublicKey(
  ecPublicKey: elliptic.curve.base.BasePoint,
): string {
  return bnToHex32(ecPublicKey.getX());
}

/**
 * Convert an (r, s) signature struct to a string.
 */
export function serializeSignature(
  signature: { r: string, s: string },
): string {
  return `${normalizeHex32(signature.r)}${normalizeHex32(signature.s)}`;
}

/**
 * Convert a serialized signature to an (r, s) struct.
 */
export function deserializeSignature(
  signature: string,
): SignatureStruct {
  if (signature.length !== 128) {
    throw new Error(
      `Invalid serialized signature, expected a hex string with length 128: ${signature}`,
    );
  }
  return {
    r: signature.slice(0, 64),
    s: signature.slice(64),
  };
}
