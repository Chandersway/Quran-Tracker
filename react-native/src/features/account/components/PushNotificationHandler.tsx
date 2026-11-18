import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AppState, Linking, Platform } from 'react-native';
import { deviceStorage } from '../../../services/storage/deviceStorage';
import { pushDeviceKeys } from '../../../services/notifications/pushDeviceKeys';
import { getBackend } from '../../../config/runtime';
import { useAppStore } from '../../../state/store';
import {
  parseGroupReply,
  resolveGroupReplyNavigation,
  validPushUuid,
} from '../../../services/notifications/groupPushPolicy';
import { invalidateGroupPush } from '../../../services/notifications/groupPushState';
import { initializeGroupPushHandler } from '../../../services/notifications/groupPushRuntime';
import {
  parseLocalNotificationUrl,
  planNotificationUrl,
  type LocalNotificationTap,
} from '../../../services/notifications/notificationDestinations';
import {
  syncRegisteredPushDevice,
  unregisterPushDevice,
} from '../../../services/notifications/pushDevice';

type PendingTap = { kind: 'group'; eventId: string; recipient?: string } | LocalNotificationTap;

/** Resolve notification IDs through the authenticated server; never trust a supplied group code or URL. */
export function PushNotificationHandler() {
  const { state } = useAppStore();
  const language = useRef(state.preferences.language);
  language.current = state.preferences.language;
  const plans = useRef(state.plans);
  plans.current = state.plans;
  const canNavigate = useRef(state.preferences.onboardingComplete);
  canNavigate.current = state.preferences.onboardingComplete;
  const pending = useRef<PendingTap | null>(null);
  const consume = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;
    initializeGroupPushHandler();
    const backend = getBackend();
    let active = true;
    let lastAccount: string | null | undefined;
    let routing = false;
    const consumed = new Set<string>();
    let sessionJob: ReturnType<typeof setTimeout> | undefined;

    consume.current = async () => {
      if (routing || !canNavigate.current || !pending.current) return;
      const tap = pending.current;
      pending.current = null;
      if (tap.kind === 'goals' || tap.kind === 'agenda') {
        if (active)
          await Linking.openURL(
            tap.kind === 'goals' ? 'qurantracker://goals' : 'qurantracker://plan',
          ).catch(() => undefined);
        await Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
        return;
      }
      if (tap.kind === 'planning') {
        const plan = plans.current.find((item) => item.id === tap.planId);
        const url = plan ? planNotificationUrl(plan) : null;
        if (active && url) await Linking.openURL(url).catch(() => undefined);
        await Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
        return;
      }
      if (!backend) return;
      if (consumed.has(tap.eventId)) return;
      consumed.add(tap.eventId);
      routing = true;
      try {
        const target = await resolveGroupReplyNavigation(tap, {
          account: async () => (await backend.auth.getSession())?.user.id ?? null,
          target: (eventId) => backend.notifications.groupPushTarget(eventId),
        });
        if (!active || !target) return;
        await Linking.openURL(
          `qurantracker://group/${encodeURIComponent(target.groupCode)}?postId=${encodeURIComponent(target.postId)}`,
        );
      } catch {
        /* Failed membership/identity checks never open an unverified destination. */
      } finally {
        routing = false;
        await Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
      }
    };
    const handleResponse = (response: Notifications.NotificationResponse) => {
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
      const data = response.notification.request.content.data;
      if (
        data?.kind === 'daily_goal' ||
        data?.kind === 'daily_reading' ||
        data?.kind === 'wirdna-daily-reading'
      ) {
        pending.current = { kind: 'goals' };
        void consume.current();
        return;
      }
      if (data?.kind === 'planning' && typeof data.planId === 'string') {
        pending.current = { kind: 'planning', planId: data.planId };
        void consume.current();
        return;
      }
      const reply = parseGroupReply(response);
      if (!reply) return;
      pending.current = { kind: 'group', ...reply };
      void consume.current();
    };
    const handleUrl = (raw: string | null) => {
      if (!raw) return;
      const local = parseLocalNotificationUrl(raw);
      if (local) {
        pending.current = local;
        void consume.current();
        return;
      }
      let url: URL;
      try {
        url = new URL(raw);
      } catch {
        return;
      }
      const match = /^\/group\/([^/]+)$/.exec(url.pathname);
      if (
        url.protocol !== 'qurantracker:' ||
        url.hostname !== 'notification' ||
        !match ||
        !validPushUuid(match[1])
      )
        return;
      // Legacy Kotlin taps contain only an event ID. The RPC checks recipient ownership and membership.
      pending.current = { kind: 'group', eventId: match[1] };
      void consume.current();
    };
    const reconcileSession = async (account: string | null) => {
      if (!backend) return;
      const registeredUser = await deviceStorage.getItem(pushDeviceKeys.user);
      const optedIn = (await deviceStorage.getItem(pushDeviceKeys.registered)) === 'registered';
      if (!active || lastAccount !== account) return;
      if (optedIn && (!registeredUser || registeredUser !== account)) {
        await unregisterPushDevice(backend).catch(() => undefined);
      } else if (account && registeredUser === account) {
        const token = await Notifications.getDevicePushTokenAsync();
        if (typeof token.data === 'string')
          await syncRegisteredPushDevice(backend, language.current, token.data);
      }
    };
    const authStop =
      backend?.auth.onChange((session) => {
        const account = session?.user.id ?? null;
        if (lastAccount !== undefined && lastAccount !== account) {
          invalidateGroupPush();
          pending.current = null;
          void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
        }
        lastAccount = account;
        // Supabase auth observers run under its auth lock. Defer further auth/RPC calls until it releases.
        if (sessionJob) clearTimeout(sessionJob);
        sessionJob = setTimeout(() => {
          if (active) void reconcileSession(account).catch(() => undefined);
        }, 0);
      }) ?? (() => undefined);
    const tokenListener = Notifications.addPushTokenListener((token) => {
      if (backend && typeof token.data === 'string')
        void syncRegisteredPushDevice(backend, language.current, token.data).catch(() => undefined);
    });
    const responseListener = Notifications.addNotificationResponseReceivedListener(handleResponse);
    const urlListener = Linking.addEventListener('url', (event) => handleUrl(event.url));
    const appListener = AppState.addEventListener('change', (next) => {
      if (backend && next === 'active')
        void syncRegisteredPushDevice(backend, language.current).catch(() => undefined);
    });
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (active && response) handleResponse(response);
      })
      .catch(() => undefined);
    void Linking.getInitialURL()
      .then((url) => {
        if (active) handleUrl(url ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (sessionJob) clearTimeout(sessionJob);
      authStop();
      tokenListener.remove();
      responseListener.remove();
      urlListener.remove();
      appListener.remove();
      consume.current = async () => undefined;
    };
  }, []);

  useEffect(() => {
    if (state.preferences.onboardingComplete) void consume.current();
  }, [state.preferences.onboardingComplete]);
  useEffect(() => {
    const backend = getBackend();
    if (backend)
      void syncRegisteredPushDevice(backend, state.preferences.language).catch(() => undefined);
  }, [state.preferences.language]);
  return null;
}
