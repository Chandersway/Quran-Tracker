import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import {
  Button,
  Field,
  Icon,
  Notice,
  ProgressBar,
  Screen,
  Section,
  Segments,
  T,
  s,
} from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';
import { newId } from '../../../state/reducer';
import { focusGoals } from '../../../domain/focus';
import { useFocus } from '../providers/FocusProvider';
import { useI18n } from '../../../i18n';
import { useAppNavigation } from '../../../app/navigation/types';

function Awake() {
  useKeepAwake();
  return null;
}

export function FocusScreen() {
  const p = usePalette();
  const { state } = useAppStore();
  const nav = useAppNavigation();
  const { timer, dispatch, ready, error, retry } = useFocus();
  const { t } = useI18n();
  const [custom, setCustom] = useState(String(timer.minutes));
  useEffect(() => setCustom(String(timer.minutes)), [timer.minutes]);
  const running = timer.deadline !== null;
  const selected = focusGoals.indexOf(timer.goal);
  const motivation = (timer.goal.length + timer.minutes) % 4;
  const chooseDuration = (value: number) => {
    dispatch({ type: 'duration', minutes: value, id: newId() });
    setCustom(String(Math.min(180, Math.max(1, value))));
  };
  return (
    <Screen>
      {running && <Awake />}
      <T size={31} bold>
        {t('focus.title')}
      </T>
      <T muted style={{ marginTop: 8 }}>
        {t('focus.subtitle')}
      </T>
      {error && (
        <Notice
          error
          message={t(error === 'load' ? 'ui.focusLoadError' : 'checklist.error')}
          onRetry={retry}
        />
      )}
      <Section title={t('focus.question')} />
      <View accessibilityRole="radiogroup" style={{ gap: 8 }}>
        {focusGoals.map((goal, index) => (
          <Pressable
            key={goal}
            accessibilityRole="radio"
            accessibilityState={{ selected: goal === timer.goal, disabled: running || !ready }}
            disabled={running || !ready}
            onPress={() => dispatch({ type: 'goal', goal })}
            style={({ pressed }) => [
              s.row,
              {
                padding: 16,
                minHeight: 74,
                backgroundColor: goal === timer.goal ? p.primary : p.surface,
                borderRadius: 12,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Icon
              name={
                index === 0
                  ? 'book-open'
                  : index === 1
                    ? 'activity'
                    : index === 2
                      ? 'refresh-cw'
                      : 'layers'
              }
              color={goal === timer.goal ? p.onPrimary : p.primary}
            />
            <View style={{ flex: 1 }}>
              <T bold color={goal === timer.goal ? p.onPrimary : p.ink}>
                {t(`focus.goals.${index}.label`)}
              </T>
              <T size={13} color={goal === timer.goal ? p.onPrimary : p.muted}>
                {t(`focus.goals.${index}.subtitle`)}
              </T>
            </View>
            {goal === timer.goal && <Icon name="check" color={p.onPrimary} />}
          </Pressable>
        ))}
      </View>
      <Section title={t('focus.duration')} />
      {!running && ready && (
        <>
          <Segments
            value={String(timer.minutes)}
            onChange={(value) => chooseDuration(Number(value))}
            options={[10, 15, 25, 45].map((value) => ({
              value: String(value),
              label: `${value}${t('focus.minutesShort')}`,
            }))}
          />
          <View style={[s.row, { alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Field
                label={t('focus.custom')}
                placeholder={t('focus.customPlaceholder')}
                value={custom}
                onChangeText={(value) => setCustom(value.replace(/\D/g, '').slice(0, 3))}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <Button
              title="OK"
              disabled={!custom}
              onPress={() => chooseDuration(Number(custom))}
              style={{ marginTop: 5 }}
            />
          </View>
        </>
      )}
      <View style={{ alignItems: 'center', paddingVertical: 32, gap: 14 }}>
        <T bold color={p.primary}>
          {t(`focus.goals.${selected}.label`)}
        </T>
        <T
          size={72}
          bold
          style={{ letterSpacing: -2, fontVariant: ['tabular-nums'], lineHeight: 90 }}
        >
          {String(Math.floor(timer.remaining / 60)).padStart(2, '0')}:
          {String(timer.remaining % 60).padStart(2, '0')}
        </T>
        <View style={{ width: '100%', marginVertical: 8 }}>
          <ProgressBar
            value={1 - timer.remaining / (timer.minutes * 60)}
            label={t('focus.duration')}
          />
        </View>
        <T muted style={{ textAlign: 'center' }}>
          {t(`focus.motivations.${motivation}`)}
        </T>
      </View>
      <View style={s.row}>
        <Button
          title={t(running ? 'focus.pause' : 'focus.start')}
          icon={running ? 'pause' : 'play'}
          onPress={() => dispatch({ type: 'toggle', now: Date.now(), id: newId() })}
          disabled={!ready}
          style={{ flex: 1 }}
        />
        <Button
          title={t('focus.reset')}
          icon="rotate-ccw"
          variant="secondary"
          onPress={() => dispatch({ type: 'reset', id: newId() })}
          disabled={!ready}
        />
      </View>
      <Button
        title={t('focus.mushaf')}
        icon="book-open"
        variant="quiet"
        style={{ marginTop: 10 }}
        onPress={() => nav.navigate('Mushaf', state.cursor)}
      />
      {timer.finished && (
        <View
          style={{
            backgroundColor: p.subtle,
            borderRadius: 14,
            padding: 20,
            gap: 6,
            marginTop: 20,
          }}
        >
          <T bold>{t('focus.finishedTitle')}</T>
          <T muted>{t('focus.finishedSubtitle')}</T>
        </View>
      )}
    </Screen>
  );
}
