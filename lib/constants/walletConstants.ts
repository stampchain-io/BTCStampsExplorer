/**
 * Wallet Constants Module
 *
 * Runtime constants for wallet-related functionality
 */

/**
 * Bitcoin address formats with proper discrimination
 */
export enum AddressFormat {
  P2PKH = "p2pkh", // Legacy addresses (1...)
  P2SH = "p2sh", // Script hash addresses (3...)
  P2WPKH = "p2wpkh", // Native SegWit addresses (bc1q...)
  P2TR = "p2tr", // Taproot addresses (bc1p...)
}

/**
 * Signature types supported by Bitcoin wallets
 */
export enum SignatureType {
  ECDSA = "ecdsa", // Traditional ECDSA signatures
  SCHNORR = "schnorr", // Schnorr signatures (Taproot)
  BIP322_SIMPLE = "bip322-simple", // BIP-322 simple message signing
  BIP322_FULL = "bip322-full", // BIP-322 full message signing
}

/**
 * Address validation patterns
 */
export const ADDRESS_PATTERNS = {
  [AddressFormat.P2PKH]: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  [AddressFormat.P2SH]: /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  [AddressFormat.P2WPKH]: /^bc1q[a-z0-9]{38,58}$/,
  [AddressFormat.P2TR]: /^bc1p[a-z0-9]{58}$/,
} as const;

/**
 * Standard derivation paths for Bitcoin
 */
export const DERIVATION_PATHS = {
  // BIP-44 Legacy (P2PKH) - m/44'/0'/0'/0/0
  BIP44: { purpose: 44, coinType: 0, account: 0, change: 0, addressIndex: 0 },
  // BIP-49 Nested SegWit (P2SH-P2WPKH) - m/49'/0'/0'/0/0
  BIP49: { purpose: 49, coinType: 0, account: 0, change: 0, addressIndex: 0 },
  // BIP-84 Native SegWit (P2WPKH) - m/84'/0'/0'/0/0
  BIP84: { purpose: 84, coinType: 0, account: 0, change: 0, addressIndex: 0 },
  // BIP-86 Taproot (P2TR) - m/86'/0'/0'/0/0
  BIP86: { purpose: 86, coinType: 0, account: 0, change: 0, addressIndex: 0 },
} as const;
