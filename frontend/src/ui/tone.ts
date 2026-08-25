export type Tone = 'neutral' | 'brand' | 'violet' | 'cyan' | 'success' | 'warning' | 'danger';

/** Maps a tone to its tint class (defined in index.css). */
export const TONE_CLASS: Record<Tone, string> = {
  neutral: 'tone-neutral',
  brand: 'tone-brand',
  violet: 'tone-violet',
  cyan: 'tone-cyan',
  success: 'tone-success',
  warning: 'tone-warning',
  danger: 'tone-danger',
};
