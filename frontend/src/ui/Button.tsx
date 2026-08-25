import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';
import { Icon } from './icons';
import type { IconName } from './icons';

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'relative inline-flex items-center justify-center gap-2 font-medium rounded-xl whitespace-nowrap select-none ' +
  'transition-[transform,background-color,background-image,box-shadow,border-color,color,opacity] duration-150 ' +
  'active:translate-y-px disabled:opacity-50 disabled:pointer-events-none disabled:active:translate-y-0';

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'text-white border border-transparent ' +
    'bg-[linear-gradient(180deg,var(--color-brand-600),var(--color-brand-700))] ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_10px_26px_-12px_rgba(79,124,255,0.85)] ' +
    'hover:bg-[linear-gradient(180deg,var(--color-brand),var(--color-brand-600))] ' +
    'hover:shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_14px_32px_-10px_rgba(79,124,255,0.95)]',
  secondary:
    'text-ink bg-surface-2 border border-line-strong hover:bg-[#1b202b] hover:border-[#3a4150]',
  subtle:
    'text-muted bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:text-ink',
  ghost: 'text-muted border border-transparent hover:text-ink hover:bg-white/[0.06]',
  danger:
    'text-white border border-transparent ' +
    'bg-[linear-gradient(180deg,var(--color-danger),var(--color-danger-600))] ' +
    'shadow-[0_10px_26px_-12px_rgba(244,63,94,0.8)] hover:brightness-110',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-[15px]',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra?: string,
): string {
  return cn(BASE, BUTTON_VARIANTS[variant], SIZES[size], extra);
}

function Spinner() {
  return (
    <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconSize = size === 'sm' ? 15 : 17;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonClasses(variant, size), fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && leftIcon && <Icon name={leftIcon} size={iconSize} />}
      {children}
      {!loading && rightIcon && <Icon name={rightIcon} size={iconSize} />}
    </button>
  );
}

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** Square, icon-only button. `label` is required and becomes the accessible name. */
export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const dims = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 16 : 18;
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(BASE, BUTTON_VARIANTS[variant], dims, 'p-0', className)}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
