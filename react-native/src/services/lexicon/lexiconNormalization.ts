/** Strict source alignment: hamza seats and Arabic letter distinctions stay intact. */
export function normalizeLexiconText(value: string): string {
  return value
    .replace(/\u0640[\u0654\u0655]/g, '\u0621')
    .normalize('NFC')
    .replace(/\u0671/g, '\u0627')
    .replace(/[\u0640\u064B-\u0652\u0670\u06D6-\u06ED\s]/g, '');
}
