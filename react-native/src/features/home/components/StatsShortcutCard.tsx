import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useAppNavigation } from '../../../app/navigation/types';
import { statsOverview } from '../../../domain/statistics';
import { useI18n } from '../../../i18n';
import { CardOrnament, Icon, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppStore } from '../../../state/store';

/** One-tap entry from Home to the dedicated statistics page. */
export function StatsShortcutCard() {
  const p = usePalette();
  const nav = useAppNavigation();
  const { state } = useAppStore();
  const { t, format, locale } = useI18n();
  const overview = useMemo(
    () => statsOverview(state.history, state.progress),
    [state.history, state.progress],
  );
  const hint = overview.readActions
    ? format(
        'ui.stats.homeShortcutHint',
        overview.streak.toLocaleString(locale),
        overview.weekPages.toLocaleString(locale),
      )
    : t('ui.stats.homeShortcutEmpty');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('ui.stats.homeShortcut')}. ${hint}`}
      testID="home-stats-shortcut"
      onPress={() => nav.navigate('Stats')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: p.blueWash,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <CardOrnament surface={p.blueWash} radius={16} variant="zellij" />
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: p.surface,
        }}
      >
        <Icon name="bar-chart-2" size={22} color={p.blue} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T bold size={17}>
          {t('ui.stats.homeShortcut')}
        </T>
        <T muted size={13}>
          {hint}
        </T>
      </View>
      <Icon name="chevron-right" size={22} color={p.blue} mirrorInRtl />
    </Pressable>
  );
}
