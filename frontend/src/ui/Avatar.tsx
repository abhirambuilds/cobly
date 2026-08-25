import { cn } from './cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-[13px]',
  lg: 'h-11 w-11 text-[15px]',
};

/** Vivid but harmonious gradient pairs; picked deterministically per user. */
const GRADIENTS: Array<[string, string]> = [
  ['#6d7bff', '#9a70ff'],
  ['#34d3ee', '#4f7cff'],
  ['#9a70ff', '#f472b6'],
  ['#34d399', '#34d3ee'],
  ['#fbbf24', '#fb923c'],
  ['#fb7185', '#9a70ff'],
  ['#4f7cff', '#34d3ee'],
  ['#22d3a6', '#4f7cff'],
];

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initials(name: string, two: boolean): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (two && parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export type AvatarProps = {
  name: string;
  /** Stable id used for colour selection; falls back to name. */
  seed?: string;
  size?: AvatarSize;
  ring?: boolean;
  className?: string;
};

export function Avatar({ name, seed, size = 'md', ring, className }: AvatarProps) {
  const [from, to] = GRADIENTS[hashString(seed || name) % GRADIENTS.length];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        'ring-1 ring-inset ring-white/15',
        ring && 'ring-2 ring-canvas',
        SIZE[size],
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      title={name}
      aria-hidden="true"
    >
      {initials(name, size === 'lg')}
    </span>
  );
}

export type AvatarStackProps = {
  users: Array<{ id: string; name: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
};

export function AvatarStack({ users, max = 5, size = 'sm', className }: AvatarStackProps) {
  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;
  const overflowSize = SIZE[size];
  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {shown.map((u) => (
        <Avatar key={u.id} name={u.name} seed={u.id} size={size} ring />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
            'bg-surface-2 text-muted ring-2 ring-canvas border border-line-strong',
            overflowSize,
          )}
          title={`${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
