import { useSignal } from "@preact/signals";
import { isConnectedSignal, walletSignal } from "$client/wallet/wallet.ts";
import type { WalletDataTypes } from "$globals";

/**
 * Hook to get wallet state without polling - BEST PRACTICE VERSION
 * Directly uses existing wallet signals for optimal performance
 * No redundant state management or subscriptions needed
 */
export function useWalletState() {
  // Direct signal access - most efficient approach
  return {
    wallet: walletSignal.value as WalletDataTypes | null,
    isConnected: isConnectedSignal.value,
  };
}

/**
 * Alternative hook that creates reactive local state
 * Use this if you need the values to be reactive in the component
 * (though direct signal access is usually better)
 */
export function useWalletStateReactive() {
  const wallet = useSignal<WalletDataTypes | null>(
    walletSignal.value as WalletDataTypes | null,
  );
  const isConnected = useSignal<boolean>(isConnectedSignal.value);

  // Keep local signals in sync with global signals
  // This is more efficient than useState + useEffect
  wallet.value = walletSignal.value as WalletDataTypes | null;
  isConnected.value = isConnectedSignal.value;

  return { wallet: wallet.value, isConnected: isConnected.value };
}

/**
 * Lightweight hook that only returns wallet address - BEST PRACTICE VERSION
 * Direct signal access for optimal performance
 */
export function useWalletAddress() {
  return walletSignal.value?.address;
}

/**
 * Hook that only returns connection status - BEST PRACTICE VERSION
 * Direct signal access for optimal performance
 */
export function useWalletConnection() {
  return isConnectedSignal.value;
}
