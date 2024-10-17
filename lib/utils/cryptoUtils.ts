import { verify } from "https://esm.sh/bitcoinjs-message@2.2.0";

export function verifySignature(
  message: string,
  signature: string,
  address: string,
): boolean {
  try {
    return verify(message, address, signature);
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}
