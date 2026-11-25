import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useAppStore } from '../../../state/store';
import { getBackend } from '../../../config/runtime';
import { groupJoinCaptureReady } from '../../../services/groups/groupJoinCapture';
import { pendingGroup } from '../../../services/groups/pendingGroup';
import { groupJoinUrl } from '../../../services/groups/groupJoin';

/** Restore the confirmation destination after onboarding, auth callbacks or process recreation. */
export function GroupJoinLinkHandler() {
  const { state } = useAppStore();
  useEffect(() => {
    if (!state.preferences.onboardingComplete) return;
    let active = true;
    let delivered = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function restore(force = false) {
      await groupJoinCaptureReady;
      const saved = await pendingGroup.load();
      if (!active || !saved) return;
      const url = groupJoinUrl(saved);
      if (!force && delivered === url) return;
      delivered = url;
      // NavigationContainer subscribes after the current React commit.
      timer = setTimeout(() => {
        if (active) void Linking.openURL(url).catch(() => undefined);
      }, 0);
    }
    void restore().catch(() => undefined);
    let account: string | null | undefined;
    const stop = getBackend()?.auth.onChange((session) => {
      const previous = account;
      account = session?.user.id ?? null;
      // Only a sign-in (no account before) re-delivers; the initial session and token refreshes do not.
      if (account && previous === null)
        setTimeout(() => {
          if (active) void restore(true).catch(() => undefined);
        }, 0);
    });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      stop?.();
    };
  }, [state.preferences.onboardingComplete]);
  return null;
}
