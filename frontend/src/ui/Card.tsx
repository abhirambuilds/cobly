import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Adds a hover lift + border/shadow response (use for clickable cards). */
  hover?: boolean;
  /** Renders the signature cyan→blue→violet hairline across the top. */
  signal?: boolean;
};

/**
 * Visual shell only (surface, hairline border, radius, elevation).
 * Padding is intentionally left to the caller so cards stay flexible.
 */
export function Card({ hover, signal, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]',
        signal && 'overflow-hidden',
        hover &&
          'transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 ' +
            'hover:border-line-strong hover:shadow-[0_18px_44px_-22px_rgba(0,0,0,0.85)]',
        className,
      )}
      {...rest}
    >
      {signal && (
        <span aria-hidden className="signal-line absolute inset-x-0 top-0 h-px opacity-70" />
      )}
      {children}
    </div>
  );
}
