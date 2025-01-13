import { ScriptType, ScriptTypeInfo } from "$types/transaction.d.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";

// Helper function to convert Uint8Array to hex string
function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Script type detection functions
export function isP2PKH(script: string | Uint8Array): boolean {
  const hexScript = script instanceof Uint8Array ? toHexString(script) : script;
  return /^76a914[a-fA-F0-9]{40}88ac$/.test(hexScript);
}

export function isP2SH(script: string | Uint8Array): boolean {
  const hexScript = script instanceof Uint8Array ? toHexString(script) : script;
  return /^a914[a-fA-F0-9]{40}87$/.test(hexScript);
}

export function isP2WPKH(script: string | Uint8Array): boolean {
  const hexScript = script instanceof Uint8Array ? toHexString(script) : script;
  return /^0014[a-fA-F0-9]{40}$/.test(hexScript);
}

export function isP2WSH(script: string | Uint8Array): boolean {
  const hexScript = script instanceof Uint8Array ? toHexString(script) : script;
  return /^0020[a-fA-F0-9]{64}$/.test(hexScript);
}

export function isP2TR(script: string | Uint8Array): boolean {
  const hexScript = script instanceof Uint8Array ? toHexString(script) : script;
  return /^5120[a-fA-F0-9]{64}$/.test(hexScript);
}

// Address format validation
export function isValidBitcoinAddress(address: string): boolean {
  const p2pkhRegex = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/; // Legacy P2PKH
  const p2shRegex = /^3[1-9A-HJ-NP-Za-km-z]{25,34}$/; // P2SH
  const bech32Regex = /^(bc1q)[0-9a-z]{38,59}$/; // Bech32 P2WPKH
  const taprootRegex = /^(bc1p)[0-9a-z]{58}$/; // Bech32m P2TR (Taproot)

  return (
    p2pkhRegex.test(address) ||
    p2shRegex.test(address) ||
    bech32Regex.test(address) ||
    taprootRegex.test(address)
  );
}

// Main script type detection function
export function detectScriptType(
  scriptOrAddress: string | Uint8Array | undefined | null,
): ScriptType {
  // Handle undefined/null cases
  if (!scriptOrAddress) return "P2WPKH";

  // Handle Uint8Array
  if (scriptOrAddress instanceof Uint8Array) {
    const hexScript = toHexString(scriptOrAddress);
    if (isP2PKH(hexScript)) return "P2PKH";
    if (isP2SH(hexScript)) return "P2SH";
    if (isP2WPKH(hexScript)) return "P2WPKH";
    if (isP2WSH(hexScript)) return "P2WSH";
    if (isP2TR(hexScript)) return "P2TR";
    return "P2WPKH"; // Default if no match
  }

  // Handle string input
  const input = String(scriptOrAddress).trim();
  if (!input) return "P2WPKH";

  // Script detection (only if it looks like a hex string)
  if (/^[0-9a-fA-F]+$/.test(input)) {
    if (isP2PKH(input)) return "P2PKH";
    if (isP2SH(input)) return "P2SH";
    if (isP2WPKH(input)) return "P2WPKH";
    if (isP2WSH(input)) return "P2WSH";
    if (isP2TR(input)) return "P2TR";
  }

  // Address detection
  if (input.startsWith("bc1p")) return "P2TR";
  if (input.startsWith("bc1")) return "P2WPKH";
  if (input.startsWith("3")) return "P2SH";
  if (input.startsWith("1")) return "P2PKH";

  return "P2WPKH"; // Default to P2WPKH
}

// Helper function to get full script type info
export function getScriptTypeInfo(
  scriptOrAddress: string | Uint8Array | undefined | null,
): ScriptTypeInfo {
  const type = detectScriptType(scriptOrAddress);
  return {
    type,
    ...TX_CONSTANTS[type],
  };
}

// Helper function to validate wallet address type for minting
export function validateWalletAddressForMinting(address: string): {
  isValid: boolean;
  error?: string;
} {
  if (!address) {
    return {
      isValid: false,
      error: "No wallet address provided",
    };
  }

  // Only allow P2PKH and P2WPKH addresses for minting
  const p2pkhRegex = /^1[1-9A-HJ-NP-Za-km-z]{25,34}$/;
  const bech32Regex = /^bc1q[0-9a-z]{38,59}$/;

  if (p2pkhRegex.test(address) || bech32Regex.test(address)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: "Connected wallet address type is unsupported for minting.",
  };
}
