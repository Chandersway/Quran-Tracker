import type { Group } from '../backend/types';

export function canShareGroupProgress(group: Pick<Group, 'permissions'>): boolean {
  return (
    group.permissions?.includes('progress.create') === true &&
    group.permissions.includes('post.create')
  );
}

export function groupProgressInput(unit: string, amount: string, reference: string) {
  const value = Number(amount);
  if (
    !['page', 'ayah', 'hizb', 'juz', 'surah', 'lesson', 'custom'].includes(unit) ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 10000
  )
    throw new Error('GROUP_PROGRESS_INVALID');
  const maximum = unit === 'juz' ? 30 : unit === 'hizb' ? 60 : unit === 'surah' ? 114 : 0;
  const number = Number(reference);
  if (
    reference &&
    value === 1 &&
    (!maximum || !Number.isInteger(number) || number < 1 || number > maximum)
  )
    throw new Error('GROUP_PROGRESS_INVALID');
  return {
    unit,
    amount: value,
    source: value === 1 && reference ? `group_manual:${unit}:${number}` : 'manual',
  };
}
