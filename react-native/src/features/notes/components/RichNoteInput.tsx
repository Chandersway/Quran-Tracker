import React from 'react';
import { TextInput } from 'react-native';
import type { RichNoteInputProps } from './RichNoteInput.types.ts';

/** Web's textarea has no attributed children; the source-styled preview remains available. */
export function RichNoteInput({ text, formatSpans: _formatSpans, ...props }: RichNoteInputProps) {
  return <TextInput {...props} value={text} />;
}
