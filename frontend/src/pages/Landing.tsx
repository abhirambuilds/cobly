import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Avatar,
  AvatarStack,
  Button,
  Card,
  Icon,
  PriorityBadge,
  TaskStatusBadge,
} from '../ui';
import type { IconName } from '../ui';

const FEATURES: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: 'board',
    title: 'Projects & boards',
    body: 'Organize work into projects and move tasks across a clean, keyboard-friendly board.',
  },
  {
    icon: 'discussion',
    title: 'Discussions',
    body: 'Talk through decisions where the work lives, so context never gets lost in chat.',
  },
  {
    icon: 'calendar',
    title: 'Meetings',
    body: 'Schedule meetings, attach them to projects, and keep everyone on the same page.',
  },
  {
    icon: 'bell',
    title: 'Notifications',
    body: 'Stay in the loop on what matters — assignments, mentions, and updates, not noise.',
  },
  {
    icon: 'users',
    title: 'Members & roles',
    body: 'Invite teammates into workspaces with clear owner and member roles.',
  },
  {
    icon: 'activity',
    title: 'Activity',
    body: 'A running history of what changed, who did it, and when.',
  },
];

export function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Cobly home">
            <img src="/favicon.svg" alt="" width={28} height={28} className="rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight">Cobly</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button rightIcon="arrow-right">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button>Get started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="aurora grid-field relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/60 px-3 py-1 text-[12.5px] font-medium text-muted backdrop-blur-sm">
              <Icon name="sparkle" size={13} className="text-brand" />
              One workspace for your whole team
            </span>
            <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Where teams plan, <span className="signal-text">discuss</span>, and ship.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-lg">
              Cobly brings projects, tasks, meetings, and discussions into a single fast, focused
              home — so your team spends less time hunting and more time building.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className="w-full sm:w-auto">
                <Button size="lg" fullWidth rightIcon="arrow-right">
                  {isAuthenticated ? 'Open dashboard' : 'Get started — it’s free'}
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" fullWidth>
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Product preview — built from the real design system */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="pointer-events-none absolute -inset-x-8 -top-8 bottom-0 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(91,140,255,0.14),transparent)]" />
            <Card signal className="relative overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-3 text-[12.5px] text-faint">Product · Board</span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <BoardColumn status="todo" count={3}>
                  <PreviewTask title="Draft launch checklist" priority="high" people={['Ada L', 'Jon S']} />
                  <PreviewTask title="Collect design feedback" priority="medium" people={['Mia R']} />
                </BoardColumn>
                <BoardColumn status="in_progress" count={2}>
                  <PreviewTask title="Build onboarding flow" priority="high" people={['Ada L']} />
                  <PreviewTask title="Wire up notifications" priority="low" people={['Kai T', 'Jon S']} />
                </BoardColumn>
                <BoardColumn status="completed" count={4}>
                  <PreviewTask title="Set up workspace" priority="medium" people={['Mia R', 'Kai T']} />
                </BoardColumn>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Everything your team needs, in one place
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Thoughtfully connected features that reduce context-switching and keep work moving.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} hover className="p-6">
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line-strong bg-surface-2 text-brand">
                <Icon name={f.icon} size={20} />
              </span>
              <h3 className="font-display text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <Card signal className="aurora relative overflow-hidden px-6 py-14 text-center sm:px-12">
          <div className="relative z-10 mx-auto max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to bring your team together?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
              Create a workspace and invite your team in minutes.
            </p>
            <div className="mt-7 flex justify-center">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button size="lg" rightIcon="arrow-right">
                  {isAuthenticated ? 'Open dashboard' : 'Get started'}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-muted transition-colors hover:text-ink">
            <img src="/favicon.svg" alt="" width={22} height={22} className="rounded" />
            <span className="font-display text-sm font-semibold">Cobly</span>
          </Link>
          <p className="text-[12.5px] text-faint">© {new Date().getFullYear()} Cobly. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[13px]">
            <Link to="/login" className="text-muted transition-colors hover:text-ink">
              Sign in
            </Link>
            <Link to="/register" className="text-muted transition-colors hover:text-ink">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BoardColumn({
  status,
  count,
  children,
}: {
  status: 'todo' | 'in_progress' | 'completed';
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <TaskStatusBadge status={status} />
        <span className="text-[11px] tabular-nums text-faint">{count}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function PreviewTask({
  title,
  priority,
  people,
}: {
  title: string;
  priority: 'low' | 'medium' | 'high';
  people: string[];
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
      <p className="text-[13px] font-medium leading-snug text-ink">{title}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <PriorityBadge priority={priority} />
        {people.length > 1 ? (
          <AvatarStack users={people.map((n, i) => ({ id: `${title}-${i}`, name: n }))} size="xs" />
        ) : (
          <Avatar name={people[0]} size="xs" />
        )}
      </div>
    </div>
  );
}
