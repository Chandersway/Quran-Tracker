import React from 'react';
import { Button, Sheet, T } from '../../../shared/components';
import { useAppNavigation } from '../../../app/navigation/types';
import { useAppStore } from '../../../state/store';
import { newId, progressKey } from '../../../state/reducer';
import { localDate } from '../../../domain/localDate';
import { sourceRubName } from '../../../domain/progressActions';
import { useI18n } from '../../../i18n';

export type PartActionTarget = { kind: 'juz' | 'hizb' | 'rub'; number: number; subId?: number };
const copy = {
  nl: {
    count: (count: number) => `${count} keer gelezen. Nogmaals registreren?`,
    first: 'Deze passage als gelezen registreren?',
    remove: 'Leesregistratie verwijderen',
  },
  en: {
    count: (count: number) => `Read ${count} times. Record another reading?`,
    first: 'Record this passage as read?',
    remove: 'Remove read registration',
  },
  ar: {
    count: (count: number) => `قُرئ ${count} مرات. هل تريد تسجيل قراءة أخرى؟`,
    first: 'هل تريد تسجيل قراءة هذا المقطع؟',
    remove: 'حذف تسجيل القراءة',
  },
} as const;

/** Individual read confirmation supplements the existing multi-selection actions. */
export function PartActionsSheet({
  target,
  onClose,
  onOpen,
}: {
  target: PartActionTarget | null;
  onClose: () => void;
  onOpen?: () => void;
}) {
  const { state, dispatch } = useAppStore();
  const nav = useAppNavigation();
  const { t, format, locale } = useI18n();
  if (!target) return null;
  const { kind, number, subId = 0 } = target;
  const progress = state.progress[progressKey(kind, number, subId)];
  const name =
    kind === 'rub' ? sourceRubName(number, subId) : format(`common.${kind}Number`, number);
  const finish = (run: () => void) => {
    run();
    onClose();
  };
  return (
    <Sheet visible title={name} onClose={onClose}>
      {onOpen && (
        <Button title={t('common.open')} icon="book-open" onPress={() => finish(onOpen)} />
      )}
      <Button
        title={t('navigation.notes')}
        icon="edit-3"
        variant="secondary"
        onPress={() =>
          finish(() =>
            nav.navigate('Notes', {
              target: { scope: kind, number: kind === 'rub' ? (number - 1) * 4 + subId : number },
            }),
          )
        }
      />
      {kind !== 'hizb' && (
        <>
          <T muted style={{ marginVertical: 16 }}>
            {progress?.readCount ? copy[locale].count(progress.readCount) : copy[locale].first}
          </T>
          <Button
            title={t(progress?.isRead ? 'common.markAgain' : 'common.mark')}
            icon="check"
            onPress={() =>
              finish(() =>
                dispatch({
                  type: 'checkIn',
                  kind,
                  number,
                  subId,
                  name,
                  requestId: newId(),
                  now: Date.now(),
                  date: localDate(),
                }),
              )
            }
          />
          {!!progress?.isRead && (
            <Button
              title={copy[locale].remove}
              variant="quiet"
              onPress={() =>
                finish(() =>
                  dispatch({
                    type: 'read/unmark',
                    kind,
                    number,
                    subId,
                    now: Date.now(),
                    date: localDate(),
                  }),
                )
              }
            />
          )}
        </>
      )}
      <Button title={t('common.cancel')} variant="quiet" onPress={onClose} />
    </Sheet>
  );
}
