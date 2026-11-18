import React, { useEffect, useState } from 'react';
import { AppState, BackHandler, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../../i18n';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';
import { layoutDirection } from '../../../domain/layoutDirection';

import { addDays } from '../../../domain/journey';
import {
  Button,
  Card,
  Field,
  Notice,
  ProgressBar,
  Screen,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import {
  adjacentStep,
  DEMO_DURATION,
  freshDemoTimer,
  onboardingSteps,
  resolveOnboardingStep,
  sampleDemoTimer,
  toggleDemoTimer,
  validDemoPlan,
  type OnboardingStep,
} from '../../../domain/onboarding';

type Unit = 'surah' | 'hizb' | 'rub' | 'juz';

function ReadingDemo() {
  const { t, format } = useI18n();
  const p = usePalette();
  const [unit, setUnit] = useState<Unit>('hizb');
  const [counts, setCounts] = useState<Record<Unit, number>>({ surah: 3, hizb: 3, rub: 3, juz: 3 });
  return (
    <View style={{ gap: 12 }}>
      <Segments
        value={unit}
        onChange={setUnit}
        options={(['surah', 'hizb', 'rub', 'juz'] as const).map((value) => ({
          value,
          label: t(`unit.${value}`),
        }))}
      />
      <Card style={{ borderColor: p.line, borderWidth: 1, gap: 10 }}>
        <T translate={false} muted size={13}>
          {t('onboarding.reading.demo')}
        </T>
        <T translate={false} bold size={22}>
          {t(`onboarding.reading.${unit}.name`)}
        </T>
        <T translate={false} muted>
          {t(`onboarding.reading.${unit}.passage`)}
        </T>
        <T translate={false} bold size={28} color={p.primary} accessibilityLiveRegion="polite">
          {format('onboarding.reading.count', counts[unit])}
        </T>
        <Button
          title={t('onboarding.reading.register')}
          testID="reading_demo_register"
          variant="secondary"
          onPress={() => setCounts((old) => ({ ...old, [unit]: old[unit] + 1 }))}
        />
      </Card>
      <T translate={false} muted>
        {t('onboarding.reading.quickCheck')}
      </T>
    </View>
  );
}

function HifzDemo() {
  const { t, format } = useI18n();
  const p = usePalette();
  const [score, setScore] = useState(75);
  const [draft, setDraft] = useState('75');
  const [editing, setEditing] = useState(false);
  const n = Number(draft);
  const valid = /^\d{1,3}$/.test(draft) && n <= 100;
  const open = () => {
    setDraft(String(score));
    setEditing(true);
  };
  return (
    <View style={{ gap: 12 }}>
      <T translate={false} muted size={13}>
        {t('onboarding.reading.demo')}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.hifz.edit')}
        accessibilityHint={
          score ? format('onboarding.hifz.score', score) : t('onboarding.hifz.unrated')
        }
        onPress={open}
        onLongPress={open}
        style={{
          backgroundColor: p.subtle,
          borderColor: p.line,
          borderWidth: 1,
          borderRadius: 16,
          padding: 20,
          gap: 8,
        }}
      >
        <T translate={false} bold>
          {format('common.hizbNumber', 1)}
        </T>
        <T translate={false} bold size={26}>
          {score ? format('onboarding.hifz.score', score) : t('onboarding.hifz.unrated')}
        </T>
        <T translate={false} muted>
          {t('onboarding.hifz.hold')}
        </T>
      </Pressable>
      <T translate={false} muted>
        {t('onboarding.hifz.zero')}
      </T>
      <Sheet
        visible={editing}
        title={format('common.hizbNumber', 1)}
        onClose={() => setEditing(false)}
      >
        <Field
          label={t('onboarding.hifz.edit')}
          value={draft}
          onChangeText={setDraft}
          keyboardType="number-pad"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[0, 25, 50, 75, 100].map((value) => (
            <Button
              key={value}
              title={String(value)}
              variant={draft === String(value) ? 'primary' : 'secondary'}
              onPress={() => setDraft(String(value))}
            />
          ))}
        </View>
        <T translate={false} muted style={{ marginVertical: 16 }}>
          {t('onboarding.hifz.zero')}
        </T>
        <Button
          title={t('common.save')}
          disabled={!valid}
          onPress={() => {
            setScore(n);
            setEditing(false);
          }}
        />
        <Button
          title={t('hifz.clear')}
          variant="quiet"
          onPress={() => {
            setScore(0);
            setEditing(false);
          }}
        />
        <Button title={t('common.cancel')} variant="quiet" onPress={() => setEditing(false)} />
      </Sheet>
    </View>
  );
}

function FocusDemo() {
  const { t, format } = useI18n();
  const [timer, setTimer] = useState(freshDemoTimer);
  useEffect(() => {
    if (timer.startedAt === null) return;
    const id = setInterval(() => setTimer((old) => sampleDemoTimer(old, performance.now())), 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active')
        setTimer((old) => ({ ...sampleDemoTimer(old, performance.now()), startedAt: null }));
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [timer.startedAt !== null]);
  const running = timer.startedAt !== null;
  const seconds = Math.ceil(timer.remainingMs / 1000);
  const status = !seconds
    ? 'finished'
    : running
      ? 'reading'
      : timer.hasStarted
        ? 'paused'
        : 'ready';
  const action = running ? 'pause' : !seconds ? 'restart' : timer.hasStarted ? 'resume' : 'start';
  return (
    <View style={{ gap: 12 }}>
      <T translate={false} muted size={13}>
        {t('onboarding.reading.demo')}
      </T>
      <Card style={{ gap: 12 }}>
        <T translate={false} bold size={20}>
          {t('onboarding.pomodoro.focus')}
        </T>
        <T translate={false} muted>
          {t(`onboarding.pomodoro.${status}`)}
        </T>
        <T
          translate={false}
          bold
          size={36}
          style={{ textAlign: 'center' }}
          accessibilityLabel={format(
            'onboarding.pomodoro.remaining',
            Math.floor(seconds / 60),
            seconds % 60,
          )}
        >{`${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`}</T>
        <ProgressBar
          value={1 - timer.remainingMs / DEMO_DURATION}
          label={t('onboarding.pomodoro.focus')}
        />
        <Button
          title={t(`onboarding.pomodoro.${action}`)}
          variant="secondary"
          testID="focus_demo_toggle"
          onPress={() => setTimer((old) => toggleDemoTimer(old, performance.now()))}
        />
      </Card>
      <T translate={false} muted>
        {t('onboarding.pomodoro.phases')}
      </T>
    </View>
  );
}

type DemoPlan = { unit: 'hizb' | 'juz' | 'surah'; date: string; minute: number; reminder: boolean };
export function PlanningDemo() {
  const { t, format, locale } = useI18n();
  const p = usePalette();
  const today = localDate();
  const [draft, setDraft] = useState<DemoPlan>({
    unit: 'hizb',
    date: addDays(today, 1),
    minute: 19 * 60,
    reminder: true,
  });
  const [planned, setPlanned] = useState<DemoPlan | null>(null);
  const [chooser, setChooser] = useState<'unit' | 'date' | 'time' | null>(null);
  const [chosenHour, setChosenHour] = useState('19');
  const [chosenMinute, setChosenMinute] = useState('00');
  const validTime =
    /^\d{1,2}$/.test(chosenHour) &&
    /^\d{1,2}$/.test(chosenMinute) &&
    Number(chosenHour) < 24 &&
    Number(chosenMinute) < 60;
  const [invalid, setInvalid] = useState(false);
  const dateLabel = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  const time = (minute: number) =>
    `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  const change = (patch: Partial<DemoPlan>) => {
    setDraft((old) => ({ ...old, ...patch }));
    setInvalid(false);
  };
  return (
    <View style={{ gap: 12 }}>
      <T translate={false} muted size={13}>
        {t('onboarding.reading.demo')}
      </T>
      <Card style={{ gap: 12, borderColor: p.line, borderWidth: 1 }}>
        <T translate={false} bold size={20}>
          {t('onboarding.planning.form')}
        </T>
        <Button
          title={format('onboarding.planning.part', t(`onboarding.planning.${draft.unit}`))}
          variant="secondary"
          onPress={() => setChooser('unit')}
        />
        <Button
          title={format('onboarding.planning.date', dateLabel(draft.date))}
          variant="secondary"
          onPress={() => setChooser('date')}
        />
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: draft.reminder }}
          onPress={() => change({ reminder: !draft.reminder })}
          style={[s.row, { justifyContent: 'space-between', minHeight: 48 }]}
        >
          <T translate={false}>{t('onboarding.planning.reminder')}</T>
          <T translate={false} bold color={p.primary}>
            {t(
              draft.reminder ? 'onboarding.planning.reminderOn' : 'onboarding.planning.reminderOff',
            )}
          </T>
        </Pressable>
        <Button
          title={`${t('onboarding.planning.time')} · ${time(draft.minute)}`}
          testID="planning_demo_time"
          variant="secondary"
          disabled={!draft.reminder}
          onPress={() => {
            setChosenHour(String(Math.floor(draft.minute / 60)));
            setChosenMinute(String(draft.minute % 60).padStart(2, '0'));
            setChooser('time');
          }}
        />
        <View style={s.row}>
          <Button
            title="− 30"
            variant="quiet"
            disabled={!draft.reminder}
            onPress={() => change({ minute: (draft.minute + 1410) % 1440 })}
          />
          <Button
            title="+ 30"
            variant="quiet"
            disabled={!draft.reminder}
            onPress={() => change({ minute: (draft.minute + 30) % 1440 })}
          />
        </View>
        {invalid && <Notice error message={t('onboarding.planning.invalid')} />}
        <Button
          title={t('onboarding.planning.schedule')}
          testID="planning_demo_schedule"
          variant="secondary"
          onPress={() => {
            if (!validDemoPlan(draft.date, draft.minute, draft.reminder, new Date()))
              setInvalid(true);
            else {
              setPlanned({ ...draft });
              setInvalid(false);
            }
          }}
        />
      </Card>
      {planned && (
        <Card color={p.subtle} style={{ gap: 6 }}>
          <T translate={false} bold>
            {t('onboarding.planning.planned')}
          </T>
          <T translate={false}>{t(`onboarding.planning.${planned.unit}`)}</T>
          <T translate={false}>
            {dateLabel(planned.date)}
            {planned.reminder ? ` · ${time(planned.minute)}` : ''}
          </T>
          <T translate={false} muted>
            {t(
              planned.reminder
                ? 'onboarding.planning.reminderOn'
                : 'onboarding.planning.reminderOff',
            )}
          </T>
        </Card>
      )}
      <T translate={false} muted>
        {t('onboarding.planning.help')}
      </T>
      <Sheet
        visible={chooser !== null}
        title={t(
          chooser === 'unit'
            ? 'onboarding.planning.choosePart'
            : chooser === 'time'
              ? 'onboarding.planning.time'
              : 'onboarding.planning.chooseDate',
        )}
        onClose={() => setChooser(null)}
      >
        {chooser === 'unit' ? (
          (['hizb', 'juz', 'surah'] as const).map((unit) => (
            <Button
              key={unit}
              title={t(`onboarding.planning.${unit}`)}
              variant="quiet"
              onPress={() => {
                change({ unit });
                setChooser(null);
              }}
            />
          ))
        ) : chooser === 'time' ? (
          <View style={{ gap: 12 }}>
            <Field
              label={t('notifications.hours')}
              value={chosenHour}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(value) => setChosenHour(value.replace(/\D/g, '').slice(0, 2))}
            />
            <Field
              label={t('notifications.minutesLabel')}
              value={chosenMinute}
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(value) => setChosenMinute(value.replace(/\D/g, '').slice(0, 2))}
            />
            <Button
              title={t('common.save')}
              testID="planning_demo_time_save"
              disabled={!validTime}
              onPress={() => {
                if (!validTime) return;
                change({ minute: Number(chosenHour) * 60 + Number(chosenMinute) });
                setChooser(null);
              }}
            />
            <Button title={t('common.cancel')} variant="quiet" onPress={() => setChooser(null)} />
          </View>
        ) : (
          [0, 1, 2].map((offset) => {
            const date = addDays(localDate(), offset);
            return (
              <Button
                key={date}
                title={dateLabel(date)}
                variant="quiet"
                onPress={() => {
                  change({ date });
                  setChooser(null);
                }}
              />
            );
          })
        )}
      </Sheet>
    </View>
  );
}

function StatisticsDemo() {
  const { t, format } = useI18n();
  const p = usePalette();
  return (
    <View style={{ gap: 12 }}>
      <T translate={false} muted size={13}>
        {t('onboarding.reading.demo')}
      </T>
      <Card style={{ gap: 12 }}>
        <T translate={false} bold size={20}>
          {t('onboarding.statistics.activity')}
        </T>
        <T translate={false} muted>
          {t('onboarding.statistics.repetitions')}
        </T>
        {(
          [
            ['hizb', 5],
            ['juz', 2],
            ['surah', 3],
          ] as const
        ).map(([name, count]) => (
          <View
            key={name}
            style={{
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: p.line,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <T translate={false} bold>
              {t(
                name === 'surah'
                  ? 'onboarding.reading.surah.passage'
                  : `onboarding.reading.${name}.name`,
              )}
            </T>
            <T translate={false} bold color={p.primary}>
              {format('onboarding.reading.count', count)}
            </T>
          </View>
        ))}
      </Card>
      <T translate={false} muted>
        {t('onboarding.statistics.repeatHelp')}
      </T>
    </View>
  );
}

function GroupsDemo() {
  const { t, format } = useI18n();
  const p = usePalette();
  const [feedback, setFeedback] = useState<'createInfo' | 'joinInfo' | null>(null);
  return (
    <View style={{ gap: 12 }}>
      <T translate={false} muted size={13}>
        {t('onboarding.reading.demo')}
      </T>
      <Card style={{ gap: 8 }}>
        <T translate={false} bold size={20}>
          {t('onboarding.groups.name')}
        </T>
        <T translate={false} muted>
          {format('onboarding.groups.members', 3)}
        </T>
        <T translate={false} bold color={p.primary} style={{ marginTop: 10 }}>
          {t('onboarding.groups.feed')}
        </T>
        <T translate={false} bold>
          {t('onboarding.groups.yusuf')}
        </T>
        <T translate={false}>{t('onboarding.groups.message')}</T>
        <T translate={false} bold size={19} style={{ marginTop: 12 }}>
          {t('group.leaderboard')}
        </T>
        <T translate={false} muted>
          {t('onboarding.groups.pointsHelp')}
        </T>
        {(
          [
            ['yusuf', 240],
            ['ahmed', 180],
            ['ibrahim', 120],
          ] as const
        ).map(([name, points], index) => (
          <View key={name} style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
            <T translate={false}>
              {format('onboarding.groups.position', index + 1, t(`onboarding.groups.${name}`))}
            </T>
            <T translate={false} bold color={p.primary}>
              {format('onboarding.groups.points', points)}
            </T>
          </View>
        ))}
      </Card>
      <Button
        title={t('onboarding.groups.create')}
        variant="secondary"
        onPress={() => setFeedback('createInfo')}
      />
      <Button
        title={t('onboarding.groups.join')}
        variant="secondary"
        onPress={() => setFeedback('joinInfo')}
      />
      {feedback && <Notice message={t(`onboarding.groups.${feedback}`)} />}
    </View>
  );
}

const previews: Record<OnboardingStep, React.ComponentType> = {
  reading: ReadingDemo,
  hifz: HifzDemo,
  pomodoro: FocusDemo,
  planning: PlanningDemo,
  statistics: StatisticsDemo,
  groups: GroupsDemo,
};

export function OnboardingFlow({
  replay = false,
  onClose,
}: { replay?: boolean; onClose?: () => void } = {}) {
  const p = usePalette();
  const { state, dispatch } = useAppStore();
  const { t, format } = useI18n();
  const [replayStep, setReplayStep] = useState<OnboardingStep>('reading');
  const step = replay ? replayStep : resolveOnboardingStep(state.preferences.onboardingStep);
  const move = (next: OnboardingStep | 'language') => {
    if (replay) {
      if (next === 'language') onClose?.();
      else setReplayStep(next);
    } else dispatch({ type: 'preferences', patch: { onboardingStep: next } });
  };
  const finish = () => {
    if (replay) onClose?.();
    else
      dispatch({
        type: 'preferences',
        patch: { onboardingComplete: true, onboardingStep: 'reading' },
      });
  };
  const back = () => {
    if (step === 'language') return false;
    move(adjacentStep(step, -1) ?? 'language');
    return true;
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', back);
    return () => sub.remove();
  }, [step]);
  const Preview = step === 'language' ? null : previews[step];
  const index = step === 'language' ? -1 : onboardingSteps.indexOf(step);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: p.background,
        direction: layoutDirection(state.preferences.language),
      }}
    >
      <Screen style={{ flexGrow: 1, paddingBottom: 32, gap: 20 }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T translate={false} bold size={25}>
            wirdna
          </T>
          {step !== 'language' && (
            <Button title={t('onboarding.skip')} variant="quiet" onPress={finish} />
          )}
        </View>
        {step === 'language' ? (
          <>
            <T translate={false} bold size={30} accessibilityRole="header">
              {t('onboarding.language.title')}
            </T>
            <T translate={false} muted>
              {t('onboarding.language.description')}
            </T>
            <View style={{ gap: 10 }}>
              {(
                [
                  { value: 'nl', label: 'Nederlands' },
                  { value: 'en', label: 'English' },
                  { value: 'ar', label: 'العربية' },
                ] as const
              ).map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: state.preferences.language === option.value }}
                  onPress={() =>
                    dispatch({ type: 'preferences', patch: { language: option.value } })
                  }
                  style={{
                    minHeight: 56,
                    padding: 16,
                    borderWidth: state.preferences.language === option.value ? 2 : 1,
                    borderColor: state.preferences.language === option.value ? p.primary : p.line,
                    borderRadius: 12,
                    backgroundColor: p.surface,
                  }}
                >
                  <T translate={false} bold>
                    {option.label}
                  </T>
                </Pressable>
              ))}
            </View>
            <Button title={t('onboarding.language.continue')} onPress={() => move('reading')} />
          </>
        ) : (
          <>
            <T translate={false} bold size={30} accessibilityRole="header">
              {t(`onboarding.${step}.title`)}
            </T>
            <T translate={false} muted>
              {t(`onboarding.${step}.description`)}
            </T>
            {Preview && <Preview key={step} />}
            <View
              accessibilityLabel={format('onboarding.progress', index + 1, onboardingSteps.length)}
              style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 }}
            >
              {onboardingSteps.map((item) => (
                <View
                  key={item}
                  style={{
                    width: item === step ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: item === step ? p.clay : p.line,
                  }}
                />
              ))}
            </View>
            <Button
              title={t(
                index === onboardingSteps.length - 1 ? 'onboarding.start' : 'onboarding.next',
              )}
              onPress={() => {
                const next = adjacentStep(step, 1);
                if (next) move(next);
                else finish();
              }}
            />
            {index > 0 && (
              <Button title={t('onboarding.previous')} variant="secondary" onPress={back} />
            )}
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}
