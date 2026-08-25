import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon } from './icons';
import type { IconName } from './icons';
import { TONE_CLASS } from './tone';
import type { Tone } from './tone';

export type { Tone };

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  icon?: IconName;
  dot?: boolean;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', icon, dot, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-none',
        TONE_CLASS[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

/* ---- Domain-specific badges: one source of truth for status colours ---- */

export function TaskStatusBadge({ status }: { status: 'todo' | 'in_progress' | 'completed' }) {
  if (status === 'completed') return <Badge tone="success" icon="check">Completed</Badge>;
  if (status === 'in_progress') return <Badge tone="brand" dot>In progress</Badge>;
  return <Badge tone="neutral" dot>To do</Badge>;
}

export function ProjectStatusBadge({ status }: { status: 'active' | 'completed' | 'archived' }) {
  if (status === 'active') return <Badge tone="brand" dot>Active</Badge>;
  if (status === 'completed') return <Badge tone="success" icon="check">Completed</Badge>;
  return <Badge tone="neutral" icon="inbox">Archived</Badge>;
}

export function MeetingStatusBadge({ status }: { status: 'scheduled' | 'completed' | 'cancelled' }) {
  if (status === 'scheduled') return <Badge tone="brand" dot>Scheduled</Badge>;
  if (status === 'completed') return <Badge tone="success" icon="check">Completed</Badge>;
  return <Badge tone="danger" icon="x-circle">Cancelled</Badge>;
}

export function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' }) {
  const tone: Tone = priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'neutral';
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return (
    <Badge tone={tone} icon="flag">
      {label}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: 'owner' | 'member' }) {
  if (role === 'owner') return <Badge tone="violet" icon="crown">Owner</Badge>;
  return <Badge tone="neutral" icon="user">Member</Badge>;
}
