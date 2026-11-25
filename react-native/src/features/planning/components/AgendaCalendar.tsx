import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { Plan } from '../../../state/models';
import { localDate } from '../../../domain/localDate';

import {
  agendaDayStatus,
  agendaWeekDates,
  moveAgendaPeriod,
  type AgendaDayStatus,
} from '../../../domain/agenda';
import { parseDateKey } from '../../../domain/journey';
import { useI18n } from '../../../i18n';
import { usePalette } from '../../../shared/theme';
import { Button, Card, IconButton, T, s } from '../../../shared/components';

export function AgendaCalendar({
  value,
  plans,
  onChange,
}: {
  value: string;
  plans: readonly Plan[];
  onChange: (date: string) => void;
}) {
  const p = usePalette();
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const today = localDate();
  let calendarValue = value;
  try {
    parseDateKey(value);
  } catch {
    calendarValue = today;
  }
  const selected = new Date(`${calendarValue}T12:00:00`);
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const monthCells = Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, index) =>
    index >= offset && index < offset + total
      ? `${year}-${String(month + 1).padStart(2, '0')}-${String(index - offset + 1).padStart(2, '0')}`
      : null,
  );
  const cells = expanded ? monthCells : agendaWeekDates(calendarValue);
  const colors: Record<AgendaDayStatus, string> = {
    Empty: p.line,
    Planned: p.muted,
    Partial: p.clay,
    Completed: p.primary,
    Missed: p.danger,
  };
  return (
    <Card style={{ marginTop: 16, padding: 14 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T translate={false} bold size={18} style={{ flex: 1 }}>
          {selected.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </T>
        <IconButton
          name="chevron-left"
          mirrorInRtl
          label="agenda.previous"
          onPress={() => onChange(moveAgendaPeriod(calendarValue, -1, expanded))}
        />
        <IconButton
          name="chevron-right"
          mirrorInRtl
          label="agenda.next"
          onPress={() => onChange(moveAgendaPeriod(calendarValue, 1, expanded))}
        />
      </View>
      <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
        <Button
          title={expanded ? 'agenda.hideMonth' : 'agenda.showMonth'}
          variant="quiet"
          onPress={() => setExpanded((open) => !open)}
        />
        <Button
          title="agenda.todayTitle"
          variant="quiet"
          disabled={value === today}
          onPress={() => onChange(today)}
        />
      </View>
      {expanded && (
        <View style={{ flexDirection: 'row' }}>
          {Array.from({ length: 7 }, (_, index) => (
            <View
              key={index}
              style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 8 }}
            >
              <T translate={false} size={11} muted>
                {new Date(2026, 0, 5 + index).toLocaleDateString(locale, { weekday: 'short' })}
              </T>
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((date, index) => {
          const status = date ? agendaDayStatus(date, plans, today) : 'Empty';
          const active = date === value;
          return (
            <View key={date ?? `empty-${index}`} style={{ width: '14.2857%', padding: 2 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  date
                    ? `${new Date(`${date}T12:00:00`).toLocaleDateString(locale, { dateStyle: 'full' })}${status === 'Empty' ? '' : `, ${t(`agenda.legend.${status.toLowerCase()}`)}`}`
                    : ''
                }
                accessibilityState={{ selected: active, disabled: !date }}
                disabled={!date}
                onPress={() => {
                  if (date) onChange(date);
                }}
                style={{
                  minHeight: expanded ? 54 : 82,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: active ? p.primary : 'transparent',
                }}
              >
                {!expanded && date && (
                  <T translate={false} size={10} color={active ? p.onPrimary : p.muted}>
                    {new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' })}
                  </T>
                )}
                <T translate={false} bold={active} size={14} color={active ? p.onPrimary : p.ink}>
                  {date ? Number(date.slice(-2)).toLocaleString(locale) : ''}
                </T>
                {date && (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: active ? p.onPrimary : colors[status],
                    }}
                  />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
