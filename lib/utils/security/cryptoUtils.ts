import { verify } from "https://esm.sh/bitcoinjs-message@2.2.0";
import { Verifier } from "https://esm.sh/bip322-js@3.0.0";

export function verifySignature(
  message: string,
  signature: string,
  address: string,
): boolean {
  // Try legacy Bitcoin message verification first (most wallets)
  try {
    return verify(message, address, signature, undefined, true);
  } catch (_legacyError) {
    // Legacy verification failed — likely BIP-322 format (Leather, etc.)
  }

  // Try BIP-322 verification (handles modern wallet signature formats)
  try {
    return Verifier.verifySignature(address, message, signature);
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}
