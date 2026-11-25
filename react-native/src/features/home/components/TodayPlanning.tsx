import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { localDate } from '../../../domain/localDate';
import { useI18n } from '../../../i18n';
import { Button, Row, T } from '../../../shared/components';
import { useAppStore } from '../../../state/store';
import { StatisticsSurface } from '../../practice/components/StatisticsSurface';

export function TodayPlanning() {
  const { state, dispatch } = useAppStore();
  const { t } = useI18n();
  const nav = useNavigation();
  const today = localDate();
  const plans = state.plans.filter((plan) => plan.date === today);
  return (
    <StatisticsSurface ornament="lattice" style={{ paddingVertical: 12, gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <T size={20} bold style={{ flex: 1 }}>
          {t('app.planningToday')}
        </T>
        <Button
          title={t('app.agenda')}
          variant="quiet"
          onPress={() => nav.navigate('Plan' as never)}
        />
      </View>
      {plans.length ? (
        plans.map((plan) => (
          <Row
            key={plan.id}
            icon={plan.isDone ? 'check-circle' : 'circle'}
            title={plan.displayName}
            translateTitle={false}
            subtitle={plan.isDone ? t('app.completed') : undefined}
            onPress={() =>
              dispatch({
                type: 'plan/toggle',
                id: plan.id,
                completed: !plan.isDone,
                now: Date.now(),
                date: today,
              })
            }
          />
        ))
      ) : (
        <T muted size={14}>
          {t('app.noPlanningToday')}
        </T>
      )}
    </StatisticsSurface>
  );
}
