import {
  UTXOAttachmentInfo,
  WalletStampWithValue,
} from "$lib/types/wallet.d.ts";

/**
 * Determines if the atomic icon should be displayed for a stamp
 * The atomic icon indicates that some of the stamp's supply is attached to UTXOs
 *
 * @param stamp - The stamp data with balance and unbound_quantity information
 * @returns boolean indicating if atomic icon should be displayed
 */
export function isAtomicIconVisible(stamp: WalletStampWithValue): boolean {
  // Atomic icon should only be shown for wallet stamps with UTXO attachment data
  if (
    !stamp || typeof stamp.balance !== "number" ||
    typeof stamp.unbound_quantity !== "number"
  ) {
    return false;
  }

  // Calculate attached quantity: balance - unbound_quantity
  const attachedQuantity = stamp.balance - stamp.unbound_quantity;

  // Show atomic icon if any stamps are attached to UTXOs
  return attachedQuantity > 0;
}

/**
 * Gets detailed UTXO attachment information for a stamp
 *
 * @param stamp - The stamp data with balance and unbound_quantity information
 * @returns UTXOAttachmentInfo object with detailed attachment status
 */
export function getUTXOAttachmentInfo(
  stamp: WalletStampWithValue,
): UTXOAttachmentInfo {
  const balance = stamp.balance || 0;
  const unbound_quantity = stamp.unbound_quantity || 0;
  const attachedQuantity = Math.max(0, balance - unbound_quantity);

  return {
    hasUTXOAttachment: attachedQuantity > 0,
    attachedQuantity,
    unattachedQuantity: unbound_quantity,
    totalBalance: balance,
  };
}

/**
 * Validates that a stamp has the required fields for UTXO attachment checking
 *
 * @param stamp - The stamp data to validate
 * @returns boolean indicating if stamp has required fields
 */
export function hasUTXOAttachmentData(
  stamp: any,
): stamp is WalletStampWithValue {
  return (
    stamp &&
    typeof stamp.balance === "number" &&
    typeof stamp.unbound_quantity === "number" &&
    stamp.balance >= 0 &&
    stamp.unbound_quantity >= 0
  );
}
