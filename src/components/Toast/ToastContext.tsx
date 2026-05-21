import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import './Toast.css';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ShowToastOptions = {
  /** Text secundar sub titlu. */
  message: string;
  /** Opțional; implicit după variantă (ex. „Succes!”, „Eroare”). */
  title?: string;
  variant?: ToastVariant;
  /** ms; 0 = nu se închide automat. Implicit 5000 */
  duration?: number;
};

type ToastItem = Required<Pick<ShowToastOptions, 'message'>> &
  Pick<ShowToastOptions, 'duration'> & {
    id: string;
    title: string;
    variant: ToastVariant;
  };

type ToastContextValue = {
  showToast: (options: ShowToastOptions) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function defaultTitleForVariant(variant: ToastVariant): string {
  switch (variant) {
    case 'success':
      return 'Succes!';
    case 'error':
      return 'Eroare';
    case 'warning':
      return 'Atenție';
    default:
      return 'Informație';
  }
}

function nextId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  switch (variant) {
    case 'success':
      return (
        <span className="app-toast__icon-badge app-toast__icon-badge--success" aria-hidden>
          <i className="fa-solid fa-check" />
        </span>
      );
    case 'error':
      return (
        <span className="app-toast__icon-badge app-toast__icon-badge--error" aria-hidden>
          <i className="fa-solid fa-exclamation" />
        </span>
      );
    case 'warning':
      return (
        <span className="app-toast__icon-badge app-toast__icon-badge--warning" aria-hidden>
          <i className="fa-solid fa-triangle-exclamation" />
        </span>
      );
    default:
      return (
        <span className="app-toast__icon-badge app-toast__icon-badge--info" aria-hidden>
          <i className="fa-solid fa-circle-info" />
        </span>
      );
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const t = timeouts.current.get(id);
    if (t !== undefined) {
      clearTimeout(t);
      timeouts.current.delete(id);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback((options: ShowToastOptions) => {
    const id = nextId();
    const variant = options.variant ?? 'info';
    const duration = options.duration ?? 5000;
    const title = options.title?.trim() || defaultTitleForVariant(variant);
    const item: ToastItem = {
      id,
      title,
      message: options.message,
      variant,
      duration,
    };
    setItems((prev) => [...prev, item]);

    if (duration > 0) {
      const handle = setTimeout(() => {
        timeouts.current.delete(id);
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, duration);
      timeouts.current.set(id, handle);
    }

    return id;
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="app-toast-stack" aria-live="polite" aria-relevant="additions text">
        {items.map((toast) => (
          <div key={toast.id} className={`app-toast app-toast--${toast.variant}`} role="status">
            <div className="app-toast__icon-cell">
              <ToastIcon variant={toast.variant} />
            </div>
            <div className="app-toast__text">
              <strong className="app-toast__title">{toast.title}</strong>
              <p className="app-toast__message">{toast.message}</p>
            </div>
            <button
              type="button"
              className="app-toast__close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Închide"
            >
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast trebuie folosit în interiorul ToastProvider.');
  }
  return ctx;
}
