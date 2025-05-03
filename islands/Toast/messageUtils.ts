import { MESSAGES, WalletProvider } from "./messages.ts";
import type { ToastType } from "./ToastProvider.tsx";

type WalletSuccessAction = keyof typeof MESSAGES.WALLET.SUCCESS;
type WalletErrorAction = keyof typeof MESSAGES.WALLET.ERROR;
type WalletAction = WalletSuccessAction | WalletErrorAction;
type ValidationRequired = keyof typeof MESSAGES.VALIDATION.REQUIRED;
type ValidationInvalid = keyof typeof MESSAGES.VALIDATION.INVALID;
type ValidationKey = ValidationRequired | ValidationInvalid;
type TransactionSuccess = keyof typeof MESSAGES.TRANSACTION.SUCCESS;
type TransactionError = keyof typeof MESSAGES.TRANSACTION.ERROR;
type TransactionSubType = TransactionSuccess | TransactionError;
type MessageFunction = (param: string) => string;

export class MessageUtil {
  static getTransactionMessage(
    type: "SUCCESS" | "ERROR",
    subType: TransactionSubType,
    params?: Record<string, string>,
  ): string {
    const message = MESSAGES
      .TRANSACTION[type][
        subType as keyof typeof MESSAGES.TRANSACTION[typeof type]
      ];

    if (typeof message === "function") {
      const messageFn = message as MessageFunction;
      if (params) {
        return messageFn(params.txid || params.error || "");
      }
      return messageFn("");
    }
    return message as string;
  }

  static getValidationMessage(
    type: "REQUIRED" | "INVALID",
    key: ValidationKey,
  ): string {
    return MESSAGES
      .VALIDATION[type][key as keyof typeof MESSAGES.VALIDATION[typeof type]];
  }

  static getWalletMessage(
    type: "SUCCESS" | "ERROR",
    action: WalletAction,
    provider: WalletProvider = "DEFAULT",
  ): string {
    const messageGroup = MESSAGES.WALLET[type];
    if (action in messageGroup) {
      const messages = messageGroup[action as keyof typeof messageGroup];
      return (messages as Record<WalletProvider, string>)[provider] ||
        (messages as Record<WalletProvider, string>)["DEFAULT"];
    }
    return MESSAGES.WALLET.ERROR.UNEXPECTED.DEFAULT;
  }

  static getMessageType(type: "SUCCESS" | "ERROR"): ToastType {
    return type === "SUCCESS" ? "success" : "error";
  }
}
