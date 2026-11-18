import { readingUnitLabelKey } from '../../../domain/readingUnit';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useAppNavigation } from '../../../app/navigation/types';
import { readingPlanDone } from '../../../domain/readingPlan';
import { useI18n } from '../../../i18n';
import { Card, Notice, T, s } from '../../../shared/components';
import { ProgressRing } from '../../../shared/components/ProgressRing';
import { useAppStore } from '../../../state/store';
import { useReadingPlan } from '../hooks/useReadingPlan';
const key = (source: string) => `readingPlan.${source}`;
export function ReadingPlanHomeCard({ onOpen }: { onOpen?: () => void }) {
  const { state } = useAppStore();
  const navigation = useAppNavigation();
  const { t, locale } = useI18n();
  const { plan, ready, error, retry } = useReadingPlan();
  const done = readingPlanDone(plan, state.history);
  const quantity = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 });
  const fraction =
    ready && plan.started && plan.target > 0 ? Math.max(0, Math.min(1, done / plan.target)) : 0;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen ?? (() => navigation.navigate('ReadingPlan'))}
      style={{ marginTop: 20 }}
    >
      <Card ornament="zellij">
        {error ? (
          <Notice error message={t(key('Opslaan mislukt. Probeer opnieuw.'))} onRetry={retry} />
        ) : !ready ? (
          <ActivityIndicator />
        ) : (
          <View style={[s.row, { flexDirection: 'row', gap: 20 }]}>
            <ProgressRing
              size={84}
              value={fraction}
              label={t(key('Mijn leesplan'))}
              primary={`${Math.round(fraction * 100).toLocaleString(locale)}%`}
            />
            <View style={{ flex: 1 }}>
              <T bold size={21}>
                {t(key('Mijn leesplan'))}
              </T>
              <T translate={false} muted style={{ marginVertical: 6 }}>
                {ready && plan.started
                  ? `${quantity(done)} / ${quantity(plan.target)} ${t(readingUnitLabelKey(plan.unit))}`
                  : t(key('Stel je eigen leesdoel in'))}
              </T>
              <T>{t(key(plan.started ? 'Bekijken en aanpassen →' : 'Plan instellen →'))}</T>
            </View>
          </View>
        )}
      </Card>
    </Pressable>
  );
}
