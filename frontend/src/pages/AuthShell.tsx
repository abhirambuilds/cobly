import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Input } from '../ui';
import type { IconName, InputProps } from '../ui';

const HIGHLIGHTS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'board',
    title: 'Projects & boards',
    body: 'Plan work on Kanban boards that keep every task moving.',
  },
  {
    icon: 'discussion',
    title: 'Discussions',
    body: 'Keep decisions and context next to the work they belong to.',
  },
  {
    icon: 'calendar',
    title: 'Meetings & notifications',
    body: 'Schedule, track, and stay in the loop without the noise.',
  },
];

/** Split-composition scaffold shared by Login and Register. */
export function AuthShell({
  title,
  subtitle,
  children,
  altPrompt,
  altLabel,
  altTo,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  altPrompt: string;
  altLabel: string;
  altTo: string;
}) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.05fr_1fr]">
      {/* Brand / story panel */}
      <aside className="aurora grid-field relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link to="/" className="relative z-10 flex items-center gap-2.5 text-ink">
          <img src="/favicon.svg" alt="" width={30} height={30} className="rounded-lg" />
          <span className="font-display text-xl font-semibold tracking-tight">Cobly</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-[2.4rem] font-semibold leading-[1.1] tracking-tight text-ink">
            The calm home for your team’s <span className="signal-text">work</span>.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Projects, tasks, meetings, and discussions — organized in one fast, focused workspace.
          </p>

          <ul className="mt-9 space-y-5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex gap-3.5">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line-strong bg-surface/60 text-brand backdrop-blur-sm">
                  <Icon name={h.icon} size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{h.title}</p>
                  <p className="text-[13px] leading-relaxed text-muted">{h.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[12.5px] text-faint">
          © {new Date().getFullYear()} Cobly — built for teams that ship.
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-[400px]">
          {/* Compact brand for small screens */}
          <Link to="/" className="mb-8 inline-flex items-center gap-2.5 text-ink lg:hidden">
            <img src="/favicon.svg" alt="" width={28} height={28} className="rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight">Cobly</span>
          </Link>

          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-center text-sm text-muted">
            {altPrompt}{' '}
            <Link
              to={altTo}
              className="font-medium text-brand transition-colors hover:text-brand-strong"
            >
              {altLabel}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-snug tone-danger"
    >
      <Icon name="alert-triangle" size={16} className="mt-px shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/** Text input with a show/hide affordance. */
export function PasswordInput(props: InputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-faint transition-colors hover:text-ink"
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        <Icon name={show ? 'eye-off' : 'eye'} size={17} />
      </button>
    </div>
  );
}
