import type { ReactNode } from 'react';
import { cn } from './cn';
import { Icon } from './icons';
import type { IconName } from './icons';
import { Button } from './Button';
import { TONE_CLASS } from './tone';
import type { Tone } from './tone';

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn('spin', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden="true" />;
}

/** Full-viewport loader for app bootstrap / route gating. */
export function LoadingScreen({ label = 'Loading Cobly' }: { label?: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas">
      <div className="flex flex-col items-center gap-4">
        <img src="/favicon.svg" alt="" width={40} height={40} className="opacity-90" />
        <div className="flex items-center gap-2.5 text-sm text-muted">
          <Spinner size={16} />
          {label}…
        </div>
      </div>
    </div>
  );
}

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  tone?: Tone;
  className?: string;
};

export function EmptyState({
  icon = 'inbox',
  title,
  message,
  action,
  tone = 'brand',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-white/[0.015] px-6 py-14 text-center',
        className,
      )}
    >
      <span
        className={cn(
          'mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border',
          TONE_CLASS[tone],
        )}
      >
        <Icon name={icon} size={22} />
      </span>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export type ErrorStateProps = {
  title?: string;
  message?: ReactNode;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn’t load this just now. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-danger/25 bg-danger/[0.04] px-6 py-12 text-center',
        className,
      )}
      role="alert"
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border tone-danger">
        <Icon name="alert-triangle" size={22} />
      </span>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{message}</p>}
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" leftIcon="refresh" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
