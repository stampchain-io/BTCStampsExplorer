// ToastContext.tsx
import { ToastComponent } from "$islands/Toast/ToastComponent.tsx";
import {
  type BaseToast,
  toastSignal,
} from "$lib/utils/ui/notifications/toastSignal.ts";
import type { ToastProviderProps } from "$types/ui.d.ts";
import { useEffect, useState } from "preact/hooks";

// Re-define Toast type for internal state management in ToastProvider if needed, or use BaseToast directly
// This Toast type is for the state array within ToastProvider (which includes an id)
export interface Toast extends Omit<BaseToast, "autoDismiss"> {
  id: string; // Toast instances in the provider need an id for keying and removal
  duration: number; // Duration for the toast display
  autoDismiss: boolean; // Required: whether the toast should auto-dismiss
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const getDuration = (type: BaseToast["type"]) => {
    return type === "error" ? 8000 : 4000;
  };

  const shouldAutoDismiss = (type: BaseToast["type"]) => {
    // Info messages should not auto-dismiss
    return type !== "info";
  };

  // This function adds to the local `toasts` state array
  const internalAddToast = (
    message: string,
    type: BaseToast["type"],
    autoDismiss?: boolean,
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const duration = getDuration(type);
    // Use provided autoDismiss value, or default based on type
    const shouldDismiss = autoDismiss !== undefined
      ? autoDismiss
      : shouldAutoDismiss(type);

    setToasts((prevToasts) => [
      ...prevToasts,
      { id, message, type, autoDismiss: shouldDismiss, duration },
    ]);
    if (shouldDismiss) {
      setTimeout(() => {
        internalRemoveToast(id);
      }, duration);
    }
  };

  const internalRemoveToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    // Subscribe to the global toast signal
    // The return value of signal.subscribe is the unsubscribe function
    const unsubscribe = toastSignal.subscribe((toastMsg: BaseToast | null) => {
      if (toastMsg) {
        internalAddToast(
          toastMsg.message,
          toastMsg.type,
          toastMsg.autoDismiss,
        );
      }
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []); // Empty dependency array, subscribes once

  return (
    <>
      {children}
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => internalRemoveToast(toast.id)}
          autoDismiss={toast.autoDismiss}
          duration={toast.duration}
        />
      ))}
    </>
  );
};
