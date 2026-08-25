import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from './cn';
import { Icon } from './icons';

/** Shared control styling for inputs / textareas / selects. */
const CONTROL =
  'w-full rounded-xl bg-surface-2 text-ink text-sm border border-line-strong placeholder:text-faint ' +
  'transition-[border-color,box-shadow,background-color] duration-150 ' +
  'focus:outline-none focus:border-brand/70 focus:bg-[#171b24] ' +
  'focus:shadow-[0_0_0_3px_rgba(91,140,255,0.22)] ' +
  'disabled:opacity-55 disabled:cursor-not-allowed';

const INVALID =
  'border-danger/70 focus:border-danger/80 focus:shadow-[0_0_0_3px_rgba(251,113,133,0.22)]';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean };

export function Label({ required, className, children, ...rest }: LabelProps) {
  return (
    <label className={cn('block text-[13px] font-medium text-muted mb-1.5', className)} {...rest}>
      {children}
      {required && <span className="text-brand"> *</span>}
    </label>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export function Input({ className, invalid, ...rest }: InputProps) {
  return <input className={cn(CONTROL, 'h-10 px-3.5', invalid && INVALID, className)} {...rest} />;
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export function Textarea({ className, invalid, rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(CONTROL, 'px-3.5 py-2.5 resize-y leading-relaxed', invalid && INVALID, className)}
      {...rest}
    />
  );
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Select({ className, invalid, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          CONTROL,
          'h-10 pl-3.5 pr-9 appearance-none cursor-pointer',
          invalid && INVALID,
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  );
}

export type FieldProps = {
  /** Ties the label to its control via htmlFor/id. */
  htmlFor?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error, consistently spaced. */
export function Field({ htmlFor, label, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-danger">
          <Icon name="alert-triangle" size={13} />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
