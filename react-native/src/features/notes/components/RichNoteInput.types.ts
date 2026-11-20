import type { TextInputProps } from 'react-native';

export type RichNoteInputProps = Omit<TextInputProps, 'value' | 'defaultValue' | 'children'> & {
  text: string;
  formatSpans: string;
};
