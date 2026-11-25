import { restoreSourceCopy, screenSourceKeys } from '../../../i18n';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { deviceStorage } from '../../../services/storage/deviceStorage';
import { pushDeviceKeys } from '../../../services/notifications/pushDeviceKeys';
import { LocalRemindersPanel } from '../components/LocalRemindersPanel';
import { NotificationSystemPanel } from '../components/NotificationSystemPanel';
import { Platform, Switch, View } from 'react-native';
import { getBackend } from '../../../config/runtime';
import type {
  Group,
  GroupPushPreferences,
  NotificationPreferences,
} from '../../../services/backend/types';
import {
  Button,
  Card,
  Empty,
  Notice,
  Row,
  Screen,
  Section,
  Segments,
  T,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import {
  dismissGroupNotifications,
  enablePushDevice,
  syncRegisteredPushDevice,
  unregisterPushDevice,
} from '../../../services/notifications/pushDevice';
import { invalidateGroupPush } from '../../../services/notifications/groupPushState';

const globalDefaults: NotificationPreferences = {
  enabled: true,
  mention: true,
  reaction: true,
  announcement: true,
  invitation: true,
  join_request: true,
  update: true,
};
const labels = {
  en: {
    title: 'Notifications',
    subtitle: 'Choose which reminders reach you and when you want quiet.',
    general: 'On this device',
    enabled: 'Notifications enabled',
    daily: 'Daily reading reminder',
    planning: 'Reading plan reminders',
    quiet: 'Quiet hours',
    from: 'Quiet starts (minutes after midnight)',
    until: 'Quiet ends (minutes after midnight)',
    groups: 'Group notifications',
    groupHelp:
      'Only replies in discussions you participate in are currently sent as push notifications.',
    all: 'All posts',
    important: 'Important',
    mentions: 'Mentions',
    muted: 'Muted',
    muteFor: 'Mute duration',
    oneHour: '1 hour',
    eightHours: '8 hours',
    forever: 'Until I turn it back on',
    push: 'Device push',
    pushHelp:
      'Register this phone for group reply notifications. Permission is requested only when you press the button.',
    enablePush: 'Enable push on this device',
    disablePush: 'Unregister this device',
    registered: 'This device is registered for group replies.',
    permission: 'Allow notifications in system settings, then try again.',
    signIn: 'Sign in to manage group notification preferences.',
    noBackend:
      'Online notification preferences are not configured. Local choices stay on this device.',
    loading: 'Loading your groups…',
    loadError: 'Could not load notification preferences.',
    empty: 'No reading groups yet',
    saved: 'Notification preferences saved.',
    failed: 'Could not save this setting. Check your connection and try again.',
    physical: 'Push registration needs an installed Android or iOS build on a physical device.',
    pending: 'Device push is not configured yet. Add the platform credentials before enabling it.',
    localSaved: 'Local preferences saved.',
    group: 'Group',
    retry: 'Try again',
    saving: 'Saving…',
    stateOn: 'On',
    stateOff: 'Off',
    system: 'Allow notifications in system settings to receive push alerts.',
  },
  nl: {
    title: 'Meldingen',
    subtitle: 'Kies welke herinneringen je ontvangt en wanneer je rust wilt.',
    general: 'Op dit apparaat',
    enabled: 'Meldingen ingeschakeld',
    daily: 'Dagelijkse leesherinnering',
    planning: 'Herinneringen voor je leesplan',
    quiet: 'Stille uren',
    from: 'Stilte begint (minuten na middernacht)',
    until: 'Stilte eindigt (minuten na middernacht)',
    groups: 'Groepsmeldingen',
    groupHelp:
      'Momenteel worden alleen reacties in gesprekken waaraan je deelneemt als push verzonden.',
    all: 'Alles',
    important: 'Belangrijk',
    mentions: 'Vermeldingen',
    muted: 'Gedempt',
    muteFor: 'Duur dempen',
    oneHour: '1 uur',
    eightHours: '8 uur',
    forever: 'Tot ik het weer aanzet',
    push: 'Push op dit apparaat',
    pushHelp:
      'Registreer deze telefoon voor groepsreacties. Alleen met de knop hieronder wordt om toestemming gevraagd.',
    enablePush: 'Push inschakelen',
    disablePush: 'Dit apparaat afmelden',
    registered: 'Dit apparaat ontvangt groepsreacties.',
    permission: 'Sta meldingen toe in de systeeminstellingen en probeer opnieuw.',
    signIn: 'Log in om groepsmeldingen te beheren.',
    noBackend:
      'Online meldingsvoorkeuren zijn niet ingesteld. Lokale keuzes blijven op dit apparaat.',
    loading: 'Je groepen laden…',
    loadError: 'Meldingsvoorkeuren laden is niet gelukt.',
    empty: 'Nog geen leesgroepen',
    saved: 'Meldingsvoorkeuren opgeslagen.',
    failed: 'Opslaan is niet gelukt. Controleer je verbinding en probeer opnieuw.',
    physical:
      'Pushregistratie vereist een geïnstalleerde Android- of iOS-app op een echt apparaat.',
    pending: 'Push is nog niet ingesteld. Voeg eerst de platformgegevens toe.',
    localSaved: 'Lokale voorkeuren opgeslagen.',
    group: 'Groep',
    retry: 'Opnieuw proberen',
    saving: 'Opslaan…',
    stateOn: 'Aan',
    stateOff: 'Uit',
    system: 'Sta meldingen toe in de systeeminstellingen om push te ontvangen.',
  },
  ar: {
    title: 'الإشعارات',
    subtitle: 'اختر التذكيرات التي تصلك وأوقات الهدوء.',
    general: 'على هذا الجهاز',
    enabled: 'تفعيل الإشعارات',
    daily: 'تذكير القراءة اليومي',
    planning: 'تذكيرات خطة القراءة',
    quiet: 'ساعات الهدوء',
    from: 'بداية الهدوء (دقائق بعد منتصف الليل)',
    until: 'نهاية الهدوء (دقائق بعد منتصف الليل)',
    groups: 'إشعارات المجموعات',
    groupHelp: 'تُرسل حاليًا إشعارات الردود في النقاشات التي تشارك فيها فقط.',
    all: 'الكل',
    important: 'مهم',
    mentions: 'الإشارات',
    muted: 'مكتوم',
    muteFor: 'مدة الكتم',
    oneHour: 'ساعة',
    eightHours: '8 ساعات',
    forever: 'حتى أعيد التفعيل',
    push: 'الإشعارات الفورية',
    pushHelp: 'سجّل هذا الجهاز لاستقبال ردود المجموعة. لن نطلب الإذن إلا عند الضغط على الزر.',
    enablePush: 'تفعيل الإشعارات لهذا الجهاز',
    disablePush: 'إلغاء تسجيل هذا الجهاز',
    registered: 'تم تسجيل هذا الجهاز لإشعارات الردود.',
    permission: 'اسمح بالإشعارات من إعدادات النظام ثم حاول مجددًا.',
    signIn: 'سجّل الدخول لإدارة إشعارات المجموعات.',
    noBackend: 'إعدادات الإشعارات عبر الإنترنت غير مهيأة. تبقى الاختيارات المحلية على هذا الجهاز.',
    loading: 'جارٍ تحميل المجموعات…',
    loadError: 'تعذر تحميل إعدادات الإشعارات.',
    empty: 'لا توجد مجموعات قراءة بعد',
    saved: 'تم حفظ إعدادات الإشعارات.',
    failed: 'تعذر حفظ الإعداد. تحقق من الاتصال وحاول مجددًا.',
    physical: 'يتطلب التسجيل تثبيت تطبيق Android أو iOS على جهاز فعلي.',
    pending: 'لم تُجهز خدمة الدفع بعد. أضف بيانات المنصة أولًا.',
    localSaved: 'تم حفظ الإعدادات المحلية.',
    group: 'مجموعة',
    retry: 'إعادة المحاولة',
    saving: 'جارٍ الحفظ…',
    stateOn: 'مفعّل',
    stateOff: 'متوقف',
    system: 'اسمح بالإشعارات من إعدادات النظام لاستقبال التنبيهات.',
  },
} as const;
const categoryLabels = {
  en: [
    'Mentions',
    'Replies in your discussions',
    'Announcements',
    'Invitations',
    'Join requests',
    'Group posts and updates',
  ],
  nl: [
    'Vermeldingen',
    'Reacties in je gesprekken',
    'Aankondigingen',
    'Uitnodigingen',
    'Toetredingsverzoeken',
    'Groepsberichten en updates',
  ],
  ar: [
    'الإشارات',
    'الردود في نقاشاتك',
    'الإعلانات',
    'الدعوات',
    'طلبات الانضمام',
    'منشورات المجموعة والتحديثات',
  ],
} as const;
type Override = GroupPushPreferences;

export function NotificationsScreen() {
  const backend = useMemo(() => getBackend(), []);
  const { state } = useAppStore();
  const p = usePalette();
  const t = restoreSourceCopy(
    state.preferences.language,
    labels[state.preferences.language],
    labels.en,
    screenSourceKeys.notifications,
  );
  const [global, setGlobal] = useState(globalDefaults);
  const [groups, setGroups] = useState<Group[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [signedIn, setSignedIn] = useState(false);
  const [pushRegistered, setPushRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!backend) {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      const user = await backend.auth.getUser();
      setSignedIn(Boolean(user));
      setPushRegistered(
        Boolean(
          user &&
            (await deviceStorage.getItem(pushDeviceKeys.registered)) === 'registered' &&
            (await deviceStorage.getItem(pushDeviceKeys.user)) === user.id,
        ),
      );
      if (!user) {
        setGroups([]);
        setOverrides({});
        setLoading(false);
        return;
      }
      const [preferences, myGroups] = await Promise.all([
        backend.notifications.loadGroupPushPreferences(),
        backend.groups.list(),
      ]);
      setGlobal(preferences);
      setGroups(myGroups);
      const rows = await Promise.all(
        myGroups.map(
          async (group) =>
            [group.code, await backend.notifications.loadGroupPreferences(group.code)] as const,
        ),
      );
      setOverrides(Object.fromEntries(rows));
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }, [backend, t.loadError]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(
    () =>
      backend?.auth.onChange(() => {
        void load();
      }),
    [backend, load],
  );

  async function saveGlobal(patch: Partial<NotificationPreferences>) {
    if (!backend || !signedIn) return;
    const next = { ...global, ...patch };
    setBusy(true);
    setError('');
    setNotice('');
    try {
      invalidateGroupPush();
      await backend.notifications.saveGroupPushPreferences(next);
      setGlobal(next);
      if (!next.enabled) await dismissGroupNotifications();
      else {
        if (!next.reaction) await dismissGroupNotifications(undefined, 'group_reply');
        if (!next.update) await dismissGroupNotifications(undefined, 'group_post');
      }
      await syncRegisteredPushDevice(backend, state.preferences.language);
      setNotice(t.saved);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  async function saveGroup(group: Group, level: string) {
    if (!backend) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = await backend.notifications.updateGroupPreferences(
        group.code,
        level,
        level !== 'muted',
        null,
      );
      if (
        !updated.pushEnabled ||
        ['muted', 'mentions'].includes(updated.level) ||
        updated.mutedUntil
      )
        await dismissGroupNotifications(group.code);
      else if (updated.level !== 'all') await dismissGroupNotifications(group.code, 'group_post');
      setOverrides((current) => ({ ...current, [group.code]: updated }));
      setNotice(t.saved);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  async function registerDevice() {
    if (!backend || !signedIn) {
      setError(t.signIn);
      return;
    }
    if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
      setError(t.physical);
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await enablePushDevice(backend, state.preferences.language);
      setPushRegistered(true);
      setNotice(t.registered);
    } catch (error) {
      setError(
        error instanceof Error && error.message.includes('permission denied')
          ? t.permission
          : t.pending,
      );
    } finally {
      setBusy(false);
    }
  }

  async function unregisterDevice() {
    if (!backend) return;
    setBusy(true);
    setError('');
    try {
      await unregisterPushDevice(backend);
      setPushRegistered(false);
      setNotice(t.localSaved);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const level = (override: Override | undefined) =>
    !override?.pushEnabled
      ? 'muted'
      : override?.mutedUntil && Date.parse(override.mutedUntil) <= Date.now()
        ? override.level === 'muted'
          ? 'all'
          : override.level
        : (override?.level ?? 'all');

  return (
    <Screen>
      <T size={32} bold style={{ letterSpacing: -0.6 }}>
        {t.title}
      </T>
      <T muted style={{ marginTop: 6 }}>
        {t.subtitle}
      </T>
      {!backend ? <Notice message={t.noBackend} /> : null}
      {error ? <Notice message={error} error onRetry={() => void load()} /> : null}
      {notice ? <Notice message={notice} /> : null}

      <NotificationSystemPanel refreshKey={pushRegistered} />
      <LocalRemindersPanel />
      <Section
        title={
          state.preferences.language === 'nl'
            ? 'Groepsmeldingen per type'
            : state.preferences.language === 'ar'
              ? 'أنواع إشعارات المجموعة'
              : 'Group notification types'
        }
      />
      <Card style={{ borderWidth: 1, borderColor: p.line, gap: 8 }}>
        {(
          ['mention', 'reaction', 'announcement', 'invitation', 'join_request', 'update'] as const
        ).map((key, index) => {
          const names = categoryLabels[state.preferences.language];
          const title = names[index] ?? t.groups;
          return (
            <Row
              key={key}
              title={title}
              trailing={
                <Switch
                  value={global[key]}
                  disabled={busy || !signedIn}
                  onValueChange={(value) => void saveGlobal({ [key]: value })}
                  trackColor={{ false: p.line, true: p.lime }}
                  thumbColor={global[key] ? p.primary : p.surface}
                  accessibilityLabel={title}
                />
              }
            />
          );
        })}
        <Row
          title={t.enabled}
          trailing={
            <Switch
              value={global.enabled}
              disabled={busy || !signedIn}
              onValueChange={(enabled) => void saveGlobal({ enabled })}
              trackColor={{ false: p.line, true: p.lime }}
              thumbColor={global.enabled ? p.primary : p.surface}
              accessibilityLabel={t.enabled}
            />
          }
        />
      </Card>

      <Section title={t.push} />
      <Card style={{ borderWidth: 1, borderColor: p.line, gap: 12 }}>
        <T size={14} muted>
          {t.pushHelp}
        </T>
        <T size={13} color={pushRegistered ? p.primary : p.muted}>
          {pushRegistered ? t.registered : t.system}
        </T>
        <Button
          title={pushRegistered ? t.disablePush : t.enablePush}
          icon={pushRegistered ? 'bell-off' : 'bell'}
          variant={pushRegistered ? 'secondary' : 'primary'}
          loading={busy}
          disabled={!backend || !signedIn}
          onPress={() => void (pushRegistered ? unregisterDevice() : registerDevice())}
        />
      </Card>

      <Section title={t.groups} />
      <T size={14} muted>
        {t.groupHelp}
      </T>
      {!signedIn ? (
        <Empty icon="lock" title={t.signIn} message={t.groupHelp} />
      ) : loading ? (
        <Card style={{ borderWidth: 1, borderColor: p.line }}>
          <T muted>{t.loading}</T>
        </Card>
      ) : groups.length === 0 ? (
        <Empty icon="users" title={t.empty} message={t.groupHelp} />
      ) : (
        <View style={{ gap: 12, marginTop: 12 }}>
          {groups.map((group) => (
            <Card key={group.id} style={{ borderWidth: 1, borderColor: p.line, gap: 8 }}>
              <T bold size={17}>
                {group.name}
              </T>
              <Segments
                value={level(overrides[group.code])}
                options={[
                  { value: 'all', label: t.all },
                  { value: 'important', label: t.important },
                  { value: 'mentions', label: t.mentions },
                  { value: 'muted', label: t.muted },
                ]}
                onChange={(value) => void saveGroup(group, value)}
              />
            </Card>
          ))}
        </View>
      )}
      {groups.length > 0 && signedIn ? <Notice message={t.groupHelp} /> : null}
    </Screen>
  );
}
