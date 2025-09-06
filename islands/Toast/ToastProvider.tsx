// ToastContext.tsx
import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";
import { ToastComponent } from "./ToastComponent.tsx";

interface ToastContextType {
  addToast: (message: string, type: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message: string, type: string) => {
    console.log("TOAST", message, type);
    const id = Math.random().toString(36).substr(2, 9);
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  const contextValue = {
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.map((toast) => <ToastComponent key={toast.id} {...toast} />)}
    </ToastContext.Provider>
  );
};
