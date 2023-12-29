// ToastContext.tsx
import { createContext } from 'preact';
import { useState, useContext } from 'preact/hooks';
import { ToastComponent } from './ToastComponent.tsx';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type) => {
    console.log("TOAST", message, type);
    const id = Math.random().toString(36).substr(2, 9);
    setToasts([...toasts, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => {
    setToasts(toasts.filter((toast) => toast.id !== id));
  };

  const contextValue = {
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.map(toast => (
        <ToastComponent key={toast.id} {...toast} />
      ))}
    </ToastContext.Provider>
  );
};
