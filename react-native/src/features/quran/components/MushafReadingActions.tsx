import React, { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAppStore } from '../../../state/store';
import { localDate } from '../../../domain/localDate';
import { newId } from '../../../state/reducer';
import { mushafPageMark, mushafPageRange } from '../../../domain/mushafReading';
import type { MushafEdition } from '../../../state/models';
import type { RootStack } from '../../../app/navigation/types';
import { Button, Icon, Sheet, T } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { useAppNavigation } from '../../../app/navigation/types';
import { usePalette } from '../../../shared/theme';
import { s } from '../../../shared/components/styles';

/** Opening a book is not a reading check-in. Only the explicit action records it. */
export function MushafReadingActions({
  edition,
  pages,
  context,
  compact = false,
  sessionId,
}: {
  edition: MushafEdition;
  pages: number[];
  context?: RootStack['Mushaf'];
  compact?: boolean;
  sessionId?: string;
}) {
  const { state, dispatch, ownerId } = useAppStore();
  const { t, format } = useI18n();
  const p = usePalette();
  const session = useRef(sessionId ?? newId());
  const navigation = useAppNavigation();
  const [confirm, setConfirm] = useState(false);
  const [targetDone, setTargetDone] = useState(false);
  const plan = context?.planId ? state.plans.find((item) => item.id === context.planId) : undefined;
  const target = context?.readingTarget;
  // A cover or an unmapped PDF page cannot silently count as Quran reading.
  const knownContent = pages.length > 0 && pages.every((page) => !!mushafPageRange(edition, page));
  const marks = pages.map((page) =>
    typeof ownerId === 'string' ? mushafPageMark(state.history, edition, page, ownerId) : undefined,
  );
  const done = knownContent && marks.every(Boolean);
  const partial = marks.some(Boolean);
  const waitingForOwner = knownContent && typeof ownerId !== 'string';
  const label = knownContent
    ? done
      ? t(pages.length > 1 ? 'ui.mushaf.removePageMarks' : 'ui.mushaf.removePageMark')
      : t(pages.length > 1 ? 'ui.mushaf.markPages' : 'ui.mushaf.markPage')
    : t('app.quickCheckIn');
  function markPages() {
    if (!knownContent || typeof ownerId !== 'string') return;
    dispatch({
      type: 'mushaf/readMark',
      edition,
      pages: pages.map((page) => ({ page, title: format('repeat.page', page) })),
      marked: !done,
      ownerId,
      now: Date.now(),
      date: localDate(),
    });
  }
  return (
    <View style={{ gap: 6, width: compact ? 48 : undefined }}>
      {compact || knownContent ? (
        <Pressable
          testID="mushaf-page-read-toggle"
          accessibilityRole={knownContent ? 'checkbox' : 'button'}
          accessibilityLabel={label}
          accessibilityHint={done ? t('ui.mushaf.previousReadingsKept') : undefined}
          accessibilityState={{
            disabled: waitingForOwner,
            checked: knownContent ? (done ? true : partial ? 'mixed' : false) : undefined,
          }}
          disabled={waitingForOwner}
          onPress={
            knownContent ? markPages : () => navigation.navigate('Goals', { quickCheckIn: true })
          }
          style={({ pressed }) => [
            compact
              ? {
                  height: 48,
                  width: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 24,
                }
              : s.button,
            {
              backgroundColor: done ? p.primary : p.subtle,
              borderWidth: knownContent && !done ? 1 : 0,
              borderColor: p.primary,
              opacity: waitingForOwner ? 0.45 : pressed ? 0.75 : 1,
            },
          ]}
        >
          <Icon
            name={knownContent ? 'check' : 'plus'}
            size={22}
            color={done ? p.onPrimary : p.primary}
          />
          {!compact && (
            <T bold color={done ? p.onPrimary : p.primary}>
              {label}
            </T>
          )}
        </Pressable>
      ) : (
        <>
          <T muted size={12}>
            {t('ui.mushaf.manualRegistration')}
          </T>
          <Button
            title={t('app.quickCheckIn')}
            icon="plus"
            variant="secondary"
            onPress={() => navigation.navigate('Goals', { quickCheckIn: true })}
          />
        </>
      )}
      {!compact && (plan || target) && (
        <Button
          title={t('quickCheck.saveAsRead')}
          variant="quiet"
          disabled={targetDone || plan?.isDone}
          onPress={() => setConfirm(true)}
        />
      )}
      <Sheet visible={confirm} title={t('quickCheck.saveAsRead')} onClose={() => setConfirm(false)}>
        <T bold style={{ marginBottom: 20 }}>
          {plan?.displayName ?? target?.name}
        </T>
        <Button
          title={t('common.mark')}
          onPress={() => {
            if (plan && !plan.isDone)
              dispatch({
                type: 'plan/toggle',
                id: plan.id,
                completed: true,
                now: Date.now(),
                date: localDate(),
              });
            else if (target)
              dispatch({
                type: 'checkIn',
                ...target,
                requestId: `${session.current}:target`,
                now: Date.now(),
                date: localDate(),
              });
            setTargetDone(true);
            setConfirm(false);
          }}
        />
      </Sheet>
    </View>
  );
}
