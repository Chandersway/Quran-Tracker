import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { decodeNoteFormatSpans, noteFormatSegments } from '../editor/noteFormat';
import { noteSpanTextStyle, useNoteColors } from './FormattedNote';
import type { RichNoteInputProps } from './RichNoteInput.types.ts';
import {
  createAttributedEditorSync,
  recordNativeEditorText,
  reconcileAttributedEditor,
} from '../editor/attributedEditorSync';

/**
 * RN native TextInput builds an attributed string from its nested Text children.
 * Never pass value/defaultValue too: that duplicates text and violates Android's
 * explicit value/children invariant. Keep the child tree stable during native
 * typing: replacing it for each echoed character can reset composing spans.
 */
export function RichNoteInput({
  text,
  formatSpans,
  onSelectionChange,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}: RichNoteInputProps) {
  const colors = useNoteColors();
  const styleKey = JSON.stringify([StyleSheet.flatten(props.style), colors]);
  const focused = useRef(false);
  const [, refresh] = useState(0);
  const sync = useRef(createAttributedEditorSync({ text, formatSpans, styleKey }));
  const presentation = reconcileAttributedEditor(
    sync.current,
    { text, formatSpans, styleKey },
    focused.current,
  );
  const colorKey = JSON.stringify(colors);
  const children = useMemo(
    () => (
      <Text>
        {noteFormatSegments(presentation.text, decodeNoteFormatSpans(presentation.formatSpans)).map(
          (segment, index) => (
            <Text
              key={index}
              style={segment.span ? noteSpanTextStyle(segment.span, colors) : undefined}
            >
              {segment.text}
            </Text>
          ),
        )}
      </Text>
    ),
    [presentation, colorKey],
  );
  return (
    <TextInput
      {...props}
      onChangeText={(next) => {
        recordNativeEditorText(sync.current, next);
        onChangeText?.(next);
      }}
      onFocus={(event) => {
        focused.current = true;
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focused.current = false;
        refresh((value) => value + 1);
        onBlur?.(event);
      }}
      onSelectionChange={onSelectionChange}
    >
      {children}
    </TextInput>
  );
}
