import { MessageUtil } from "./messageUtils.ts";
import { MESSAGES, WalletProvider } from "./messages.ts";
import type { ToastType } from "./ToastProvider.tsx";

type TransactionSuccess = keyof typeof MESSAGES.TRANSACTION.SUCCESS;
type TransactionError = keyof typeof MESSAGES.TRANSACTION.ERROR;
type TransactionSubType = TransactionSuccess | TransactionError;
type ValidationRequired = keyof typeof MESSAGES.VALIDATION.REQUIRED;
type ValidationInvalid = keyof typeof MESSAGES.VALIDATION.INVALID;
type ValidationKey = ValidationRequired | ValidationInvalid;
type WalletSuccessAction = keyof typeof MESSAGES.WALLET.SUCCESS;
type WalletErrorAction = keyof typeof MESSAGES.WALLET.ERROR;
type WalletAction = WalletSuccessAction | WalletErrorAction;

export class ToastUtil {
  private static addToast: (message: string, type: ToastType) => void;

  static initialize(addToastFn: (message: string, type: ToastType) => void) {
    this.addToast = addToastFn;
  }

  static showTransactionMessage(
    type: "SUCCESS" | "ERROR",
    subType: TransactionSubType,
    params?: Record<string, string>,
  ) {
    const message = MessageUtil.getTransactionMessage(type, subType, params);
    const toastType = MessageUtil.getMessageType(type);
    this.addToast(message, toastType);
  }

  static showValidationMessage(
    type: "REQUIRED" | "INVALID",
    key: ValidationKey,
  ) {
    const message = MessageUtil.getValidationMessage(type, key);
    this.addToast(message, "error");
  }

  static showWalletMessage(
    type: "SUCCESS" | "ERROR",
    action: WalletAction,
    provider: WalletProvider = "DEFAULT",
  ) {
    const message = MessageUtil.getWalletMessage(type, action, provider);
    const toastType = MessageUtil.getMessageType(type);
    this.addToast(message, toastType);
  }
}
