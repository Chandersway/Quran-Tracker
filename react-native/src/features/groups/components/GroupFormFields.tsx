import React from 'react';
import { Switch, View } from 'react-native';
import type { GroupMemberPermissions } from '../../../services/backend/types';
import { useI18n } from '../../../i18n';
import { Field, Row, Segments, T } from '../../../shared/components';

export type GroupDraft = {
  name: string;
  description: string;
  goalType: string;
  progressUnit: string;
  goalPeriod: string;
  goalTarget: string;
  privacy: string;
  memberPermissions: GroupMemberPermissions;
};
export const blankGroupDraft = (): GroupDraft => ({
  name: '',
  description: '',
  goalType: 'free_reading',
  progressUnit: 'page',
  goalPeriod: 'none',
  goalTarget: '1',
  privacy: 'restricted',
  memberPermissions: {
    canPostMessages: true,
    canShareProgress: true,
    canComment: true,
    canInviteMembers: false,
  },
});
export function GroupFormFields({
  draft,
  onChange,
  step,
}: {
  draft: GroupDraft;
  onChange: (draft: GroupDraft) => void;
  step?: 0 | 1 | 2;
}) {
  const { t } = useI18n();
  const update = (patch: Partial<GroupDraft>) => onChange({ ...draft, ...patch });
  const types = {
    free_reading: 'typeFree',
    complete_together: 'typeKhatma',
    daily_tilawah: 'typeDaily',
    memorization: 'typeMemorization',
    murajaah: 'typeMurajaah',
    tafsir_study: 'typeStudy',
    custom: 'typeCustom',
  };
  const permissions = {
    canPostMessages: 'canPostMessages',
    canShareProgress: 'canShareProgress',
    canComment: 'canComment',
    canInviteMembers: 'canInviteMembers',
  } as const;
  return (
    <View style={{ gap: 14 }}>
      {step === undefined || step === 0 ? (
        <>
          <Field
            label={t('app.groupForm.groupName')}
            value={draft.name}
            onChangeText={(name) => update({ name })}
            maxLength={80}
          />
          <Field
            label={t('app.groupForm.description')}
            value={draft.description}
            onChangeText={(description) => update({ description })}
            multiline
            maxLength={1000}
            numberOfLines={3}
          />
          <T bold>{t('app.groupForm.groupTypeTitle')}</T>
          <Segments
            value={draft.goalType}
            options={Object.entries(types).map(([value, key]) => ({
              value,
              label: t(`app.groupManagement.${key}`),
            }))}
            onChange={(goalType) => update({ goalType })}
          />
        </>
      ) : null}
      {step === undefined || step === 1 ? (
        <>
          <T bold>{t('app.groupForm.progressUnitTitle')}</T>
          <Segments
            value={draft.progressUnit}
            options={['page', 'ayah', 'hizb', 'juz', 'surah', 'lesson', 'custom'].map((value) => ({
              value,
              label: t(`app.groupUnitOption.${value}`),
            }))}
            onChange={(progressUnit) => update({ progressUnit })}
          />
          <T bold>{t('app.groupForm.goalPeriod')}</T>
          <Segments
            value={draft.goalPeriod}
            options={['none', 'daily', 'weekly', 'monthly', 'total'].map((value) => ({
              value,
              label: t(`app.groupGoalText.${value === 'none' ? 'noFixedGoal' : value}`),
            }))}
            onChange={(goalPeriod) => update({ goalPeriod })}
          />
          {draft.goalPeriod !== 'none' ? (
            <Field
              label={t('app.groupForm.goalValue')}
              value={draft.goalTarget}
              onChangeText={(goalTarget) => update({ goalTarget })}
              keyboardType="number-pad"
              maxLength={5}
            />
          ) : null}
        </>
      ) : null}
      {step === undefined || step === 2 ? (
        <>
          <T bold>{t('app.groupForm.privacyTitle')}</T>
          <Segments
            value={draft.privacy}
            options={[
              { value: 'public', label: t('app.groupPrivacyOption.public') },
              { value: 'restricted', label: t('app.groupPrivacyOption.codeOnly') },
              { value: 'private', label: t('app.groupPrivacyOption.inviteOnly') },
            ]}
            onChange={(privacy) => update({ privacy })}
          />
          <T bold>{t('app.groupForm.permissionsTitle')}</T>
          {Object.keys(permissions).map((value) => {
            const key = value as keyof GroupMemberPermissions;
            return (
              <Row
                key={key}
                title={t(`app.groupPermissions.${key}`)}
                trailing={
                  <Switch
                    value={draft.memberPermissions[key]}
                    accessibilityLabel={t(`app.groupPermissions.${key}`)}
                    onValueChange={(enabled) =>
                      update({ memberPermissions: { ...draft.memberPermissions, [key]: enabled } })
                    }
                  />
                }
              />
            );
          })}
        </>
      ) : null}
    </View>
  );
}
export function validGroupDraft(draft: GroupDraft): boolean {
  return Boolean(
    draft.name.trim() &&
      (draft.goalPeriod === 'none' ||
        (Number.isInteger(Number(draft.goalTarget)) &&
          Number(draft.goalTarget) >= 1 &&
          Number(draft.goalTarget) <= 9999)),
  );
}
