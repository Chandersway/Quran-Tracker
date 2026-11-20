/** FocusSessionScreen.kt / MainActivity focus-state contract. */
export const focusGoals = ['reading', 'memorize', 'review', 'tafsir'] as const;
export type FocusGoal = (typeof focusGoals)[number];
export type FocusTimer = {
  version: 2;
  id: string;
  goal: FocusGoal;
  minutes: number;
  remaining: number;
  deadline: number | null;
  started: boolean;
  finished: boolean;
};
export type FocusAction =
  | { type: 'restore'; timer: FocusTimer }
  | { type: 'goal'; goal: FocusGoal }
  | { type: 'duration'; minutes: number; id: string }
  | { type: 'toggle'; now: number; id: string }
  | { type: 'sample'; now: number }
  | { type: 'reset'; id: string };
export function initialFocus(id: string): FocusTimer {
  return {
    version: 2,
    id,
    goal: 'reading',
    minutes: 25,
    remaining: 1500,
    deadline: null,
    started: false,
    finished: false,
  };
}
export function focusReducer(state: FocusTimer, action: FocusAction): FocusTimer {
  if (action.type === 'restore') return action.timer;
  if (action.type === 'sample') {
    if (state.deadline === null) return state;
    const remaining = Math.max(0, Math.ceil((state.deadline - action.now) / 1000));
    return remaining === state.remaining
      ? state
      : {
          ...state,
          remaining,
          deadline: remaining === 0 ? null : state.deadline,
          finished: remaining === 0,
        };
  }
  if (action.type === 'goal')
    return state.deadline === null ? { ...state, goal: action.goal } : state;
  if (action.type === 'duration') {
    if (state.deadline !== null) return state;
    const minutes = Math.min(180, Math.max(1, Math.trunc(action.minutes)));
    if (!Number.isFinite(minutes)) return state;
    return {
      ...state,
      id: action.id,
      minutes,
      remaining: minutes * 60,
      started: false,
      finished: false,
    };
  }
  if (action.type === 'reset')
    return {
      ...initialFocus(action.id),
      goal: state.goal,
      minutes: state.minutes,
      remaining: state.minutes * 60,
    };
  if (state.deadline !== null)
    return { ...focusReducer(state, { type: 'sample', now: action.now }), deadline: null };
  const remaining = state.remaining || state.minutes * 60;
  return {
    ...state,
    id: state.finished ? action.id : state.id,
    remaining,
    deadline: action.now + remaining * 1000,
    started: true,
    finished: false,
  };
}
export function decodeFocus(raw: string, id: string): FocusTimer {
  const value = JSON.parse(raw) as Partial<FocusTimer> & { total?: number };
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    (value.version !== undefined && ![1, 2].includes(value.version)) ||
    (value.id !== undefined && (typeof value.id !== 'string' || !value.id)) ||
    (value.started !== undefined && typeof value.started !== 'boolean') ||
    (value.finished !== undefined && typeof value.finished !== 'boolean')
  )
    throw new Error('Invalid saved focus timer');
  const minutes = value.minutes ?? (value.total !== undefined ? value.total / 60 : 25);
  if (
    !Number.isInteger(minutes) ||
    minutes < 1 ||
    minutes > 180 ||
    !Number.isInteger(value.remaining) ||
    value.remaining! < 0 ||
    value.remaining! > minutes * 60 ||
    (value.deadline !== null && value.deadline !== undefined && !Number.isFinite(value.deadline))
  )
    throw new Error('Invalid saved focus timer');
  return {
    version: 2,
    id: value.id ?? id,
    goal: focusGoals.includes(value.goal as FocusGoal) ? (value.goal as FocusGoal) : 'reading',
    minutes,
    remaining: value.remaining!,
    deadline: value.deadline ?? null,
    started: value.started ?? false,
    finished: value.finished ?? (value.started === true && value.remaining === 0),
  };
}
