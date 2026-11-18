import React from 'react';
import { Text, View, type TextStyle } from 'react-native';
import { Icon, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import {
  cleanTodoLine,
  decodeNoteFormatSpans,
  isTodoChecked,
  noteDisplayFontSize,
  noteFormatSegments,
  type NoteFormatSpan,
} from '../editor/noteFormat';

export type NoteDisplayStyle = Omit<NoteFormatSpan, 'start' | 'end'> & {
  listMode: string;
  formatSpans: string;
};
export function useNoteColors(): Record<string, string> {
  const p = usePalette();
  return {
    gold: p.ink,
    white: p.ink,
    green: p.primary,
    blue: p.blue,
    rose: '#B95D78',
    violet: '#8A5E9A',
    mint: p.primary,
    clay: p.clay,
    ink: p.ink,
  };
}
export function noteSpanTextStyle(
  style: Omit<NoteFormatSpan, 'start' | 'end'>,
  colors: Record<string, string>,
): TextStyle {
  return {
    fontSize: noteDisplayFontSize(style.fontSize, style.headingLevel),
    color: colors[style.textColorKey] ?? colors.gold,
    fontWeight: style.isBold || style.headingLevel > 0 ? '700' : '400',
    fontStyle: style.isItalic ? 'italic' : 'normal',
    textDecorationLine:
      style.isUnderline && style.isStrike
        ? 'underline line-through'
        : style.isUnderline
          ? 'underline'
          : style.isStrike
            ? 'line-through'
            : 'none',
    writingDirection: 'auto',
    textAlign: 'auto',
  };
}
/** Preserve source list/checkbox/plain/span precedence without rewriting note data. */
export function FormattedNote({ note, style }: { note: string; style: NoteDisplayStyle }) {
  const colors = useNoteColors();
  const p = usePalette();
  const base = noteSpanTextStyle(style, colors);
  if (['bullet', 'numbered', 'todo'].includes(style.listMode))
    return (
      <View style={{ gap: 4 }}>
        {note.split(/\r?\n/).map((line, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: style.listMode === 'todo' ? 'center' : 'flex-start',
              gap: 8,
            }}
          >
            {style.listMode === 'todo' ? (
              <View
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTodoChecked(line), disabled: true }}
                style={{ padding: 8 }}
              >
                <Icon
                  name={isTodoChecked(line) ? 'check-square' : 'square'}
                  color={p.muted}
                  size={20}
                />
              </View>
            ) : (
              <T translate={false} style={base}>
                {style.listMode === 'bullet' ? '*' : `${index + 1}.`}
              </T>
            )}
            <T translate={false} style={[base, { flex: 1 }]}>
              {style.listMode === 'todo' ? cleanTodoLine(line) : line}
            </T>
          </View>
        ))}
      </View>
    );
  const spans = decodeNoteFormatSpans(style.formatSpans);
  if (!spans.length)
    return (
      <T translate={false} style={base}>
        {note}
      </T>
    );
  return (
    <T translate={false} size={16} color={p.ink}>
      {noteFormatSegments(note, spans).map((segment, index) => (
        <Text
          key={index}
          style={segment.span ? noteSpanTextStyle(segment.span, colors) : undefined}
        >
          {segment.text}
        </Text>
      ))}
    </T>
  );
}
