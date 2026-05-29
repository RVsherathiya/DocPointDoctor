import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import './GlobalToast.css';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast>({
    message: '',
    type: 'info',
    visible: false,
  });

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      message,
      type,
      visible: true,
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <GlobalToast toast={toast} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// GlobalToast component rendered within the provider overlay
interface GlobalToastProps {
  toast: Toast;
  onDismiss: () => void;
}

const GlobalToast: React.FC<GlobalToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 4000); // Auto-dismiss after 4s
      return () => clearTimeout(timer);
    }
  }, [toast.visible, onDismiss]);

  if (!toast.visible) return null;

  return (
    <div className={`web-toast-container ${toast.type} ${toast.visible ? 'show' : ''}`} onClick={onDismiss}>
      <div className="web-toast-content">
        <span className="web-toast-message">{toast.message}</span>
        <button className="web-toast-close" onClick={(e) => { e.stopPropagation(); onDismiss(); }}>✕</button>
      </div>
    </div>
  );
};
