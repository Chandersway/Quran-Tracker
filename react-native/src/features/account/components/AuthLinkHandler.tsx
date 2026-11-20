import { useEffect, useRef } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { getBackend } from '../../../config/runtime';
import { sourceText, useI18n } from '../../../i18n';
import { parseAuthCallback } from '../../../services/auth/authCallback';
import { updateAuthLinkState } from '../model/authLinkState';

/** Handles trusted auth callbacks before navigation. Secrets are never logged. */
export function AuthLinkHandler() {
  const { locale } = useI18n();
  const localeRef = useRef(locale);
  localeRef.current = locale;
  useEffect(() => {
    const configuredBackend = getBackend();
    if (!configuredBackend) return;
    const auth = configuredBackend.auth;
    let active = true;
    // Initial URL and Linking can deliver the same callback concurrently. Keep
    // only callbacks currently being verified; tokens never enter persistence.
    const pending = new Set<string>();
    const failure = () => {
      if (active)
        updateAuthLinkState({
          recoveryActive: false,
          error: sourceText('accountManagement.error', localeRef.current),
        });
    };
    const stopLifecycle = auth.onLifecycle((event) => {
      if (active && event === 'recovery')
        updateAuthLinkState({ recoveryActive: true, error: null });
      if (active && event === 'signedOut')
        updateAuthLinkState({ recoveryActive: false, error: null });
    });
    const syncRefresh = (state: string | null | undefined) => {
      if (Platform.OS === 'web') return;
      auth.setRefreshActive(state === 'active');
    };
    syncRefresh(AppState.currentState);
    const appStateSubscription = AppState.addEventListener('change', syncRefresh);

    async function handleUrl(rawUrl: string | null) {
      if (!active || !rawUrl || pending.has(rawUrl)) return;
      const callback = parseAuthCallback(rawUrl);
      if (callback.kind === 'ignored') return;
      if (callback.kind === 'invalid' || callback.kind === 'failure') {
        failure();
        return;
      }
      pending.add(rawUrl);
      try {
        const { recovery } = await auth.completeCallback(callback);
        if (active)
          updateAuthLinkState({ ...(recovery ? { recoveryActive: true } : {}), error: null });
      } catch {
        failure();
      } finally {
        pending.delete(rawUrl);
      }
    }

    const subscription = Linking.addEventListener('url', (event) => {
      void handleUrl(event.url);
    });
    void Linking.getInitialURL()
      .then((url) => handleUrl(url ?? null))
      .catch(failure);
    return () => {
      active = false;
      pending.clear();
      subscription.remove();
      appStateSubscription.remove();
      stopLifecycle();
      if (Platform.OS !== 'web') auth.setRefreshActive(false);
    };
  }, []);
  return null;
}
