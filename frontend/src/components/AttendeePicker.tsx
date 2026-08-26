import type { WorkspaceMember } from '../types/workspace';
import { Avatar, Icon, cn } from '../ui';

export type AttendeePickerProps = {
  members: WorkspaceMember[];
  selected: string[];
  onToggle: (userId: string) => void;
  disabled?: boolean;
};

/**
 * A wrap of toggleable member chips for choosing meeting attendees.
 * Each chip is a real toggle button (aria-pressed) with an avatar.
 */
export function AttendeePicker({ members, selected, onToggle, disabled }: AttendeePickerProps) {
  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-line-strong bg-surface-2 px-3.5 py-3 text-[13px] text-faint">
        No members to invite yet.
      </p>
    );
  }

  return (
    <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-xl border border-line-strong bg-surface-2 p-3">
      {members.map((m) => {
        const active = selected.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onToggle(m.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[12.5px] font-medium transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-55',
              active
                ? 'border-brand/40 bg-brand/15 text-brand-strong'
                : 'border-line-strong bg-surface text-muted hover:border-line hover:text-ink',
            )}
          >
            <Avatar name={m.name} seed={m.id} size="xs" />
            {m.name}
            {active && <Icon name="check" size={13} />}
          </button>
        );
      })}
    </div>
  );
}
