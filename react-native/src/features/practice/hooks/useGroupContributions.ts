import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBackend } from '../../../config/runtime';
import { groupContribution, type GroupContribution } from '../../../services/groups/groupMetrics';

export type GroupContributionsState =
  | { status: 'unavailable' }
  | { status: 'signedOut' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; groups: GroupContribution[] };

/** Loads the viewer's share in each joined group. Only runs while the Groups tab is open. */
export function useGroupContributions(enabled: boolean): {
  state: GroupContributionsState;
  reload: () => void;
} {
  const backend = useMemo(() => getBackend(), []);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<GroupContributionsState>(
    backend ? { status: 'loading' } : { status: 'unavailable' },
  );
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!backend || !enabled) return;
    let active = true;
    setState({ status: 'loading' });
    void (async () => {
      try {
        const session = await backend.auth.getSession();
        if (!session) {
          if (active) setState({ status: 'signedOut' });
          return;
        }
        const groups = await backend.groups.list();
        const rows = await Promise.all(
          groups.map(async (group) =>
            groupContribution(
              group,
              await backend.groups.listLeaderboard(group.code),
              session.user.id,
            ),
          ),
        );
        if (active)
          setState({
            status: 'ready',
            groups: rows.sort((a, b) => b.myPages - a.myPages || a.name.localeCompare(b.name)),
          });
      } catch {
        if (active) setState({ status: 'error' });
      }
    })();
    return () => {
      active = false;
    };
  }, [backend, enabled, revision]);
  return { state, reload };
}
