import { useCallback, useRef, useState } from 'react';
import type { Action } from '../../../state/reducer';

/** One user submission keeps its identity until storage confirms it. */
export function usePracticeSave(commit: (action: Action) => Promise<void>, onSaved: () => void) {
  const pending = useRef<Action | null>(null);
  const inFlight = useRef(false);
  const completed = useRef(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [draftLocked, setDraftLocked] = useState(false);

  const reset = useCallback(() => {
    if (inFlight.current) return;
    pending.current = null;
    completed.current = false;
    setSaving(false);
    setFailed(false);
    setDraftLocked(false);
  }, []);

  async function save(prepare: () => Action): Promise<void> {
    // The ref closes the window before React renders a disabled button.
    if (inFlight.current || completed.current) return;
    inFlight.current = true;
    setSaving(true);
    setFailed(false);
    try {
      pending.current ??= prepare();
      setDraftLocked(true);
      await commit(pending.current);
      completed.current = true;
      pending.current = null;
      setDraftLocked(false);
      onSaved();
    } catch {
      // Optimistic state can already contain this action. Retry exactly that
      // action so a failed write never becomes a second registration.
      setFailed(true);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return { save, reset, saving, failed, draftLocked, isSaving: () => inFlight.current };
}
