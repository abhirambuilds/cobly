import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from './cn';
import { Icon } from './icons';
import type { IconName } from './icons';

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {item.to && !last ? (
                <Link
                  to={item.to}
                  className="truncate rounded-md text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn('truncate', last ? 'text-ink' : 'text-muted')}
                  aria-current={last ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!last && <Icon name="chevron-right" size={14} className="shrink-0 text-faint" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type PageHeaderProps = {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
  breadcrumbs?: Crumb[];
  meta?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  eyebrow,
  description,
  icon,
  actions,
  breadcrumbs,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          {icon && (
            <span className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line-strong bg-surface-2 text-brand sm:inline-flex">
              <Icon name={icon} size={20} />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[12px] font-medium uppercase tracking-[0.14em] text-faint">
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
            )}
            {meta && <div className="mt-3">{meta}</div>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
