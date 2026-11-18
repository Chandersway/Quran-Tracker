import React, { useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import { buildGroupCode } from '../../../services/groups/groupJoin';
import { useI18n } from '../../../i18n';
import { Button, Notice, T } from '../../../shared/components';
import { blankGroupDraft, GroupFormFields, validGroupDraft } from './GroupFormFields';
import { groupError } from './groupUi';

export function GroupCreateWizard({
  backend,
  onCreated,
  onCancel,
}: {
  backend: Backend;
  onCreated: (code: string) => void;
  onCancel: () => void;
}) {
  const { t, format } = useI18n();
  const [draft, setDraft] = useState(blankGroupDraft);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function create() {
    if (!validGroupDraft(draft)) return;
    setBusy(true);
    setError('');
    try {
      const group = await backend.groups.create({
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
        code: buildGroupCode(draft.name),
        goalTarget: draft.goalPeriod === 'none' ? null : Number(draft.goalTarget),
      });
      onCreated(group.code);
    } catch (reason) {
      setError(groupError(reason, 'app.groupForm.createError', t));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 16 }}>
      <T muted>{format('groups.create.stepCount', step + 1, 3)}</T>
      <T bold>
        {t(
          ['groups.create.step.basics', 'groups.create.step.goal', 'groups.create.step.access'][
            step
          ]!,
        )}
      </T>
      <T muted>{t(`groups.create.step.${step}.subtitle`)}</T>
      <GroupFormFields draft={draft} onChange={setDraft} step={step} />
      {error ? <Notice message={error} error /> : null}
      {step === 2 ? (
        <>
          <T muted>{t('app.groupForm.codeAvailableAfterSave')}</T>
          <Button
            title={t('app.groupForm.createButton')}
            loading={busy}
            disabled={busy || !validGroupDraft(draft)}
            onPress={() => void create()}
          />
        </>
      ) : (
        <Button
          title={t('groups.create.next')}
          disabled={busy || (step === 0 ? !draft.name.trim() : !validGroupDraft(draft))}
          onPress={() => setStep((value) => (value + 1) as 1 | 2)}
        />
      )}
      {step > 0 ? (
        <Button
          title={t('app.groupForm.back')}
          variant="secondary"
          disabled={busy}
          onPress={() => setStep((value) => (value - 1) as 0 | 1)}
        />
      ) : null}
      <Button title={t('common.cancel')} variant="quiet" disabled={busy} onPress={onCancel} />
    </View>
  );
}
