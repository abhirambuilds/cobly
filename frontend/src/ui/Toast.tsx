import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { Icon } from './icons';
import type { IconName } from './icons';
import { TONE_CLASS } from './tone';
import type { Tone } from './tone';

type ToastKind = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  kind: ToastKind;
  title?: string;
  message: string;
};

type ToastOptions = {
  kind?: ToastKind;
  title?: string;
  message: string;
  duration?: number;
};

export type ToastApi = {
  toast: (opts: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
};

const KIND_META: Record<ToastKind, { tone: Tone; icon: IconName }> = {
  success: { tone: 'success', icon: 'check-circle' },
  error: { tone: 'danger', icon: 'alert-triangle' },
  info: { tone: 'brand', icon: 'info' },
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ kind = 'info', title, message, duration }: ToastOptions) => {
      idRef.current += 1;
      const id = idRef.current;
      setItems((prev) => [...prev, { id, kind, title, message }]);
      const ms = duration ?? (kind === 'error' ? 6000 : 4200);
      timers.current.set(
        id,
        setTimeout(() => remove(id), ms),
      );
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (message, title) => toast({ kind: 'success', message, title }),
      error: (message, title) => toast({ kind: 'error', message, title }),
      info: (message, title) => toast({ kind: 'info', message, title }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2.5 px-4 pt-4 sm:items-end sm:px-6"
          role="region"
          aria-label="Notifications"
          aria-live="polite"
          aria-atomic="false"
        >
          {items.map((item) => {
            const meta = KIND_META[item.kind];
            return (
              <div
                key={item.id}
                role={item.kind === 'error' ? 'alert' : 'status'}
                className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line-strong bg-surface px-4 py-3 shadow-[var(--shadow-pop)]"
              >
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border',
                    TONE_CLASS[meta.tone],
                  )}
                >
                  <Icon name={meta.icon} size={15} />
                </span>
                <div className="min-w-0 flex-1 pt-px">
                  {item.title && <p className="text-sm font-semibold text-ink">{item.title}</p>}
                  <p className="text-[13px] leading-snug text-muted break-words">{item.message}</p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => remove(item.id)}
                  className="-mr-1 -mt-0.5 rounded-md p-1 text-faint transition-colors hover:text-ink"
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
