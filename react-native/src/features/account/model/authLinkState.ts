export type AuthLinkState = { recoveryActive: boolean; error: string | null };
let state: AuthLinkState = { recoveryActive: false, error: null };
const listeners = new Set<(state: AuthLinkState) => void>();

export function getAuthLinkState() {
  return state;
}
export function subscribeAuthLinkState(listener: (state: AuthLinkState) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function updateAuthLinkState(patch: Partial<AuthLinkState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener(state);
}
