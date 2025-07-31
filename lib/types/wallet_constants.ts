/**
 * Wallet Constants Module
 *
 * Runtime constants for wallet-related functionality
 */

import { AddressFormat } from "$types/wallet.d.ts";

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
