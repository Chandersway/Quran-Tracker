import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { IconButton, T, s } from './index';
import { usePalette } from '../theme';
import { localDate } from '../../domain/localDate';
import { useI18n } from '../../i18n';

export function Calendar({
  value,
  onChange,
  marked = [],
}: {
  value: string;
  onChange: (date: string) => void;
  marked?: string[];
}) {
  const p = usePalette();
  const { locale } = useI18n();
  const [month, setMonth] = useState(() => new Date(`${value}T12:00:00`));
  const year = month.getFullYear();
  const index = month.getMonth();
  const offset = (new Date(year, index, 1).getDay() + 6) % 7;
  const days = new Date(year, index + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, n) =>
    n >= offset && n < days + offset ? n - offset + 1 : null,
  );
  return (
    <View>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
        <IconButton
          name="chevron-left"
          mirrorInRtl
          label="Previous month"
          onPress={() => setMonth(new Date(year, index - 1, 1))}
        />
        <T bold>{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</T>
        <IconButton
          name="chevron-right"
          mirrorInRtl
          label="Next month"
          onPress={() => setMonth(new Date(year, index + 1, 1))}
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {Array.from({ length: 7 }, (_, day) =>
          new Date(2024, 0, day + 1).toLocaleDateString(locale, { weekday: 'narrow' }),
        ).map((d, i) => (
          <View key={i} style={{ width: '14.2857%', alignItems: 'center', padding: 8 }}>
            <T size={12} muted>
              {d}
            </T>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, n) => {
          const key =
            day === null
              ? ''
              : `${year}-${String(index + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const selected = key === value;
          const today = key === localDate();
          return (
            <View key={n} style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 2 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={key}
                accessibilityState={{ selected, disabled: day === null }}
                disabled={day === null}
                onPress={() => onChange(key)}
                style={{
                  minWidth: 42,
                  minHeight: 46,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  backgroundColor: selected ? p.primary : today ? p.lime : 'transparent',
                  gap: 2,
                }}
              >
                <T
                  size={14}
                  bold={selected}
                  color={selected ? p.onPrimary : today ? p.onLime : p.ink}
                >
                  {day ?? ''}
                </T>
                {marked.includes(key) && (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: selected ? p.onPrimary : p.primary,
                    }}
                  />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
