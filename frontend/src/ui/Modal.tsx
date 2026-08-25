import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { Icon } from './icons';
import type { IconName } from './icons';
import { IconButton, Button } from './Button';
import { TONE_CLASS } from './tone';
import type { Tone } from './tone';

export type ModalSize = 'sm' | 'md' | 'lg';

const WIDTH: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: IconName;
  tone?: Tone;
  size?: ModalSize;
  children?: ReactNode;
  footer?: ReactNode;
  /** Set false to require an explicit button/ESC to dismiss. */
  dismissOnBackdrop?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  tone = 'brand',
  size = 'md',
  children,
  footer,
  dismissOnBackdrop = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    // Move focus into the dialog (prefer a marked field, else first control, else panel).
    const autofocus =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel;
    autofocus?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-[3px] animate-fade"
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="relative flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            'relative w-full overflow-hidden rounded-2xl border border-line-strong bg-surface',
            'shadow-[var(--shadow-pop)] animate-scale-in focus:outline-none',
            WIDTH[size],
          )}
        >
          <span aria-hidden className="signal-line absolute inset-x-0 top-0 h-px" />

          {(title || icon) && (
            <div className="flex items-start gap-3 px-5 pt-5 sm:px-6">
              {icon && (
                <span
                  className={cn(
                    'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                    TONE_CLASS[tone],
                  )}
                >
                  <Icon name={icon} size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="mt-1 text-sm leading-relaxed text-muted">
                    {description}
                  </p>
                )}
              </div>
              <IconButton
                icon="close"
                label="Close dialog"
                size="sm"
                onClick={onClose}
                className="-mr-1.5 -mt-1"
              />
            </div>
          )}

          {children && <div className="px-5 py-5 sm:px-6">{children}</div>}

          {footer && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-white/[0.015] px-5 py-4 sm:px-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'brand';
  loading?: boolean;
};

/** Accessible replacement for window.confirm(). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      icon={tone === 'danger' ? 'alert-triangle' : 'info'}
      tone={tone === 'danger' ? 'danger' : 'brand'}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </Modal>
  );
}
