// ToastContext.tsx
import { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import { ToastComponent } from "./ToastComponent.tsx";
import { type BaseToast, toastSignal } from "$lib/utils/toastSignal.ts";

// Re-define Toast type for internal state management in ToastProvider if needed, or use BaseToast directly
// This Toast type is for the state array within ToastProvider (which includes an id)
export interface Toast extends BaseToast {
  id: string; // Toast instances in the provider need an id for keying and removal
}

interface ToastProviderProps {
  children: ComponentChildren;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // This function adds to the local `toasts` state array
  const internalAddToast = (
    message: string,
    type: BaseToast["type"],
    autoDismiss = true,
  ) => {
    console.log("ToastProvider InternalAdd:", { message, type, autoDismiss });
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, message, type, autoDismiss },
    ]);
    if (autoDismiss) {
      setTimeout(() => internalRemoveToast(id), 3000);
    }
  };

  const internalRemoveToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    // Subscribe to the global toast signal
    // The return value of signal.subscribe is the unsubscribe function
    const unsubscribe = toastSignal.subscribe((toastMsg: BaseToast | null) => {
      console.log("ToastProvider received from signal:", toastMsg);
      if (toastMsg) {
        internalAddToast(
          toastMsg.message,
          toastMsg.type,
          toastMsg.autoDismiss === undefined ? true : toastMsg.autoDismiss,
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
        />
      ))}
    </>
  );
};
