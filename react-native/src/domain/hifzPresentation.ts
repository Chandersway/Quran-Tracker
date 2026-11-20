import type { Progress } from '../state/models';

// AppStyle.kt: ten independent assessment buckets from low recall to mastery.
const scoreColors = [
  '#B3261E',
  '#D94A1E',
  '#F06A1C',
  '#F28E1C',
  '#E7B51C',
  '#D2D61F',
  '#A8C92B',
  '#7DC43A',
  '#4FBF4A',
  '#2FAE5F',
] as const;

export function hifzCardColors(
  progress: Pick<Progress, 'hasHifzScore' | 'progress'> | undefined,
  enabled: boolean,
): { backgroundColor: string; borderColor: string } | undefined {
  if (
    !enabled ||
    !progress?.hasHifzScore ||
    !Number.isFinite(progress.progress) ||
    progress.progress <= 0
  )
    return undefined;
  const bucket = Math.max(0, Math.min(9, Math.ceil(progress.progress / 10) - 1));
  const color = scoreColors[bucket]!;
  return { backgroundColor: `${color}55`, borderColor: color };
}
