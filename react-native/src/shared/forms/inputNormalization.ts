import type { KeyboardTypeOptions } from 'react-native';

export function isNumericKeyboard(keyboard: KeyboardTypeOptions | undefined): boolean {
  return (
    keyboard === 'numeric' ||
    keyboard === 'number-pad' ||
    keyboard === 'decimal-pad' ||
    keyboard === 'phone-pad'
  );
}

/** Normalize digits only; never alter punctuation or other user-entered characters. */
export function normalizeNumericDigits(value: string): string {
  return value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (character) => {
    const code = character.charCodeAt(0);
    return String(code - (code >= 0x06f0 ? 0x06f0 : 0x0660));
  });
}
