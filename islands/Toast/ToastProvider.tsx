// ToastContext.tsx
import { ComponentChildren, createContext } from "preact";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import { createPortal } from "preact/compat";
import { ToastComponent } from "./ToastComponent.tsx";
import { ToastUtil } from "./toastUtils.ts";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

export function ToastProvider({ children }: { children: ComponentChildren }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Initialize ToastUtil with addToast function
  useEffect(() => {
    ToastUtil.initialize(addToast);
  }, [addToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const contextValue = {
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {isMounted && createPortal(
        <div class="fixed top-5 left-5 z-[9999] flex flex-col gap-2">
          {toasts.map((toast) => <ToastComponent key={toast.id} {...toast} />)}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
