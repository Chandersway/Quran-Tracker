import { navigationCopy } from './navigationCopy';
import { bookmarkCopy } from '../../features/bookmarks/bookmarkCopy';
import { MediaSettingsSheet } from '../../features/audio/components/MediaSettings';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../state/store';
import { useI18n } from '../../i18n';
import { Button, Icon, Row, Sheet, T } from '../../shared/components';
import { usePalette } from '../../shared/theme';
import { DockGlyph } from './DockGlyph';
import { useAppNavigation } from './types';
import { mushafResume } from '../../domain/mushafResume';
import {
  defaultDockDestinations,
  maxDockDestinations,
  normalizeDockDestinations,
  visibleDockDestinations,
  type DockDestinationId,
} from '../../domain/dockPreferences';
import { dockDestinations, type DockDestination } from './dockDestinations';

export function NavigationDock({ state, navigation }: BottomTabBarProps) {
  const [more, setMore] = useState(false);
  const [media, setMedia] = useState<'closed' | 'afterMore' | 'open'>('closed');
  const [selecting, setSelecting] = useState(false);
  const { t, format, locale } = useI18n();
  const copy = navigationCopy[locale];
  const destinationLabel = (destination: DockDestination) =>
    destination.id === 'lexicon' || destination.id === 'study' || destination.id === 'books'
      ? copy[destination.id]
      : t(destination.label);
  const p = usePalette();
  const { state: app, dispatch } = useAppStore();
  const stack = useAppNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const selectedIds = normalizeDockDestinations(app.preferences.dockDestinations);
  const visibleIds = visibleDockDestinations(selectedIds);
  const selected = visibleIds.map((id) => dockDestinations.find((item) => item.id === id)!);
  const itemWidth = Math.max(48, (width - insets.left - insets.right - 12) / (selected.length + 1));
  const active = state.routes[state.index]?.name;
  function goTab(route: string) {
    const target = state.routes.find((item) => item.name === route);
    if (!target) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: target.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) navigation.navigate(route);
  }
  function go(destination: DockDestination) {
    setMore(false);
    if (destination.tab) return goTab(destination.tab);
    switch (destination.id) {
      case 'lexicon':
        stack.navigate('LexiconSearch');
        break;
      case 'study':
        stack.navigate('StudySources', undefined);
        break;
      case 'books':
        stack.navigate('Books');
        break;
      case 'mushaf':
        stack.navigate('Mushaf', mushafResume(app));
        break;
      case 'mutashabihat':
        stack.navigate('Mutashabihat');
        break;
      case 'notes':
        stack.navigate('Notes', undefined);
        break;
      case 'focus':
        stack.navigate('Focus');
        break;
      case 'checklist':
        stack.navigate('Checklist');
        break;
      case 'library':
        stack.navigate('MushafLibrary');
        break;
    }
  }
  function toggle(id: DockDestinationId) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((value) => value !== id)
      : selectedIds.length < maxDockDestinations
        ? [...selectedIds, id]
        : selectedIds;
    dispatch({ type: 'preferences', patch: { dockDestinations: next } });
  }
  const dockItem = (destination: DockDestination) => {
    const isActive = !!destination.tab && active === destination.tab;
    return (
      <Pressable
        key={destination.id}
        accessibilityRole="tab"
        accessibilityLabel={destinationLabel(destination)}
        accessibilityState={{ selected: isActive }}
        onPress={() => go(destination)}
        onLongPress={() => {
          const target = state.routes.find((route) => route.name === destination.tab);
          if (target) navigation.emit({ type: 'tabLongPress', target: target.key });
        }}
        style={({ pressed }) => ({
          width: itemWidth,
          minHeight: 60,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          opacity: pressed ? 0.55 : 1,
        })}
      >
        {destination.glyph ? (
          <DockGlyph symbol={destination.glyph} color={isActive ? p.clay : p.muted} />
        ) : (
          <Icon name={destination.icon} size={25} color={isActive ? p.clay : p.muted} />
        )}
        <T
          translate={false}
          size={11}
          bold={isActive}
          color={isActive ? p.ink : p.muted}
          numberOfLines={2}
          style={{ textAlign: 'center' }}
        >
          {destinationLabel(destination)}
        </T>
        <View
          style={{
            width: isActive ? 18 : 4,
            height: 2,
            borderRadius: 1,
            backgroundColor: isActive ? p.clay : 'transparent',
          }}
        />
      </Pressable>
    );
  };
  const moreActive = more || !selected.some((destination) => destination.tab === active);
  return (
    <>
      <View
        style={{
          backgroundColor: p.surface,
          borderTopWidth: 1,
          borderTopColor: p.line,
          paddingHorizontal: 6,
          paddingTop: 3,
          paddingBottom: Math.max(insets.bottom, 6),
          flexDirection: 'row',
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {selected.map(dockItem)}
        </ScrollView>
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel={t('ui.more')}
          accessibilityState={{ selected: moreActive }}
          onPress={() => {
            setSelecting(false);
            setMore(true);
          }}
          style={({ pressed }) => ({
            width: itemWidth,
            minHeight: 60,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            opacity: pressed ? 0.55 : 1,
          })}
        >
          <DockGlyph symbol="more" color={moreActive ? p.clay : p.muted} />
          <T
            translate={false}
            size={11}
            bold={moreActive}
            color={moreActive ? p.ink : p.muted}
            numberOfLines={1}
            style={{ textAlign: 'center' }}
          >
            {t('ui.more')}
          </T>
          <View
            style={{
              width: moreActive ? 18 : 4,
              height: 2,
              borderRadius: 1,
              backgroundColor: moreActive ? p.clay : 'transparent',
            }}
          />
        </Pressable>
      </View>
      <Sheet
        visible={more}
        title={t(selecting ? 'ui.nav.selectTitle' : 'ui.more')}
        onClose={() => {
          setMore(false);
          setSelecting(false);
        }}
        onDismiss={() => {
          if (media === 'afterMore') setMedia('open');
        }}
      >
        {selecting ? (
          <>
            <T muted size={13}>
              {format('ui.nav.selectionCount', selectedIds.length, maxDockDestinations)}
            </T>
            <T muted size={13} style={{ marginBottom: 12 }}>
              {t('ui.nav.selectionHint')}
            </T>
            {dockDestinations.map((destination) => {
              const checked = selectedIds.includes(destination.id);
              const disabled = !checked && selectedIds.length >= maxDockDestinations;
              return (
                <Pressable
                  key={destination.id}
                  accessibilityRole="checkbox"
                  accessibilityLabel={destinationLabel(destination)}
                  accessibilityState={{ checked, disabled }}
                  disabled={disabled}
                  onPress={() => toggle(destination.id)}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: p.line,
                    opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
                  })}
                >
                  <Icon name={destination.icon} size={20} color={p.primary} />
                  <T bold={checked} style={{ flex: 1 }}>
                    {destinationLabel(destination)}
                  </T>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderWidth: 1,
                      borderRadius: 6,
                      borderColor: checked ? p.primary : p.muted,
                      backgroundColor: checked ? p.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {checked && <Icon name="check" size={16} color={p.onPrimary} />}
                  </View>
                </Pressable>
              );
            })}
            <View style={{ marginTop: 16, gap: 8 }}>
              <Button
                title={t('ui.nav.restoreDefaults')}
                variant="secondary"
                onPress={() =>
                  dispatch({
                    type: 'preferences',
                    patch: { dockDestinations: [...defaultDockDestinations] },
                  })
                }
              />
              <Button title={t('ui.nav.done')} onPress={() => setSelecting(false)} />
            </View>
          </>
        ) : (
          <>
            <Row
              icon="headphones"
              title={bookmarkCopy[locale].audio}
              subtitle={bookmarkCopy[locale].audioHelp}
              translateTitle={false}
              translateSubtitle={false}
              onPress={() => {
                setMore(false);
                // UIKit can present the reciter sheet once the previous controller has dismissed.
                setMedia(Platform.OS === 'ios' ? 'afterMore' : 'open');
              }}
            />
            <Row
              icon="bookmark"
              title={bookmarkCopy[locale].title}
              translateTitle={false}
              onPress={() => {
                setMore(false);
                stack.navigate('Bookmarks');
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <T bold size={18} style={{ flex: 1 }}>
                {t('ui.nav.destinations')}
              </T>
              <Button
                title={t('ui.nav.select')}
                variant="quiet"
                onPress={() => setSelecting(true)}
                style={{ minHeight: 48, paddingHorizontal: 10 }}
              />
            </View>
            {(['reading', 'practice', 'organize'] as const).map((group) => {
              const destinations = dockDestinations.filter(
                (destination) =>
                  destination.group === group && !visibleIds.includes(destination.id),
              );
              return destinations.length > 0 ? (
                <View key={group} style={{ marginTop: 20 }}>
                  <T bold size={13} color={p.muted} style={{ marginBottom: 4 }}>
                    {copy[group]}
                  </T>
                  {destinations.map((destination) => (
                    <Row
                      key={destination.id}
                      title={destinationLabel(destination)}
                      translateTitle={false}
                      icon={destination.icon}
                      onPress={() => go(destination)}
                    />
                  ))}
                </View>
              ) : null;
            })}
            <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: p.line }}>
              <Row
                title={t('settings.title')}
                icon="sliders"
                onPress={() => {
                  setMore(false);
                  stack.navigate('Settings');
                }}
              />
              <Row
                title={t('Your account')}
                icon="user"
                onPress={() => {
                  setMore(false);
                  stack.navigate('Account');
                }}
              />
            </View>
          </>
        )}
      </Sheet>
      <MediaSettingsSheet visible={media === 'open'} onClose={() => setMedia('closed')} />
    </>
  );
}
