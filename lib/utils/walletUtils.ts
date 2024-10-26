import { walletContext } from "$client/wallet/wallet.ts";
import { leatherProvider } from "$client/wallet/leather.ts";
import { okxProvider } from "$client/wallet/okx.ts";
import { unisatProvider } from "$client/wallet/unisat.ts";

export async function signMessage(
  message: string,
  address: string,
): Promise<string> {
  const { wallet } = walletContext;

  console.log("Signing message:", message);
  console.log("For address:", address);

  if (!wallet || !wallet.provider) {
    throw new Error("Wallet not connected");
  }

  try {
    let signature: string;
    switch (wallet.provider) {
      case "leather":
        signature = await leatherProvider.signMessage(message);
        break;
      case "okx":
        signature = await okxProvider.signMessage(message);
        break;
      case "unisat":
        signature = await unisatProvider.signMessage(message);
        break;
      default:
        throw new Error("Unsupported wallet provider");
    }
    console.log("Signature received:", signature);
    return signature;
  } catch (error) {
    console.error("Error signing message:", error);
    throw new Error("Failed to sign message");
  }
}
