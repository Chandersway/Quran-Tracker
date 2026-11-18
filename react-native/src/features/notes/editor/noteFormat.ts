export interface NoteFormatSpan {
  start: number;
  end: number;
  fontSize: number;
  headingLevel: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  textColorKey: string;
}

export interface ActiveNoteFormat extends Omit<NoteFormatSpan, 'start' | 'end'> {
  hasFormatting: boolean;
}

export function decodeNoteFormatSpans(encoded: string): NoteFormatSpan[] {
  if (!encoded.trim()) return [];
  return encoded.split(';').flatMap((raw) => {
    const parts = raw.split(',');
    if (parts.length !== 9) return [];
    const integer = (value: string, fallback?: number) =>
      /^[+-]?\d+$/.test(value) &&
      Number.isInteger(Number(value)) &&
      Number(value) >= -2147483648 &&
      Number(value) <= 2147483647
        ? Number(value)
        : fallback;
    const start = integer(parts[0]!);
    const end = integer(parts[1]!);
    if (start === undefined || end === undefined) return [];
    return [
      {
        start,
        end,
        fontSize: integer(parts[2]!, 16)!,
        headingLevel: integer(parts[3]!, 0)!,
        isBold: parts[4] === '1',
        isItalic: parts[5] === '1',
        isUnderline: parts[6] === '1',
        isStrike: parts[7] === '1',
        textColorKey: parts[8] || 'gold',
      },
    ];
  });
}

export function encodeNoteFormatSpans(spans: readonly NoteFormatSpan[]): string {
  return spans
    .map((span) =>
      [
        span.start,
        span.end,
        span.fontSize,
        span.headingLevel,
        span.isBold ? 1 : 0,
        span.isItalic ? 1 : 0,
        span.isUnderline ? 1 : 0,
        span.isStrike ? 1 : 0,
        span.textColorKey || 'gold',
      ].join(','),
    )
    .join(';');
}

function sameStyle(a: NoteFormatSpan, b: NoteFormatSpan): boolean {
  return (
    a.fontSize === b.fontSize &&
    a.headingLevel === b.headingLevel &&
    a.isBold === b.isBold &&
    a.isItalic === b.isItalic &&
    a.isUnderline === b.isUnderline &&
    a.isStrike === b.isStrike &&
    a.textColorKey === b.textColorKey
  );
}

export function updateNoteFormatSpansForTextChange(
  oldText: string,
  newText: string,
  spans: readonly NoteFormatSpan[],
  active: ActiveNoteFormat,
): NoteFormatSpan[] {
  if (oldText === newText) return [...spans];
  let prefix = 0;
  const shortest = Math.min(oldText.length, newText.length);
  while (prefix < shortest && oldText[prefix] === newText[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < oldText.length - prefix &&
    suffix < newText.length - prefix &&
    oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]
  )
    suffix += 1;
  const removedEnd = oldText.length - suffix;
  const insertedEnd = newText.length - suffix;
  const insertedLength = insertedEnd - prefix;
  const delta = newText.length - oldText.length;
  const shifted = spans.flatMap((span) => {
    let start: number;
    let end: number;
    if (span.end <= prefix) {
      start = span.start;
      end = span.end;
    } else if (span.start >= removedEnd) {
      start = span.start + delta;
      end = span.end + delta;
    } else {
      start = Math.min(span.start, prefix);
      end = Math.max(start, span.end + delta);
    }
    return end > start ? [{ ...span, start, end }] : [];
  });
  if (insertedLength > 0 && active.hasFormatting) {
    shifted.push({
      start: prefix,
      end: insertedEnd,
      fontSize: active.fontSize,
      headingLevel: active.headingLevel,
      isBold: active.isBold,
      isItalic: active.isItalic,
      isUnderline: active.isUnderline,
      isStrike: active.isStrike,
      textColorKey: active.textColorKey,
    });
  }
  shifted.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: NoteFormatSpan[] = [];
  for (const span of shifted) {
    const last = merged[merged.length - 1];
    if (last && last.end === span.start && sameStyle(last, span))
      merged[merged.length - 1] = { ...last, end: span.end };
    else merged.push(span);
  }
  return merged;
}

export function noteFormatSegments(
  text: string,
  spans: readonly NoteFormatSpan[],
): { text: string; span?: NoteFormatSpan }[] {
  if (!text || !spans.length) return [{ text }];
  const bounds = new Set<number>([0, text.length]);
  for (const span of spans) {
    bounds.add(Math.max(0, Math.min(text.length, span.start)));
    bounds.add(Math.max(0, Math.min(text.length, span.end)));
  }
  const ordered = [...bounds].sort((a, b) => a - b);
  return ordered.slice(0, -1).flatMap((start, index) => {
    const end = ordered[index + 1]!;
    if (end <= start) return [];
    // AnnotatedString applies later complete styles after earlier ones.
    const span = [...spans].reverse().find((item) => item.start <= start && item.end >= end);
    return [{ text: text.slice(start, end), ...(span ? { span } : {}) }];
  });
}

export function noteDisplayFontSize(base: number, heading: number): number {
  const level = Math.min(3, Math.max(0, heading));
  return Math.min(
    34,
    Math.max(12, base + (level === 1 ? 8 : level === 2 ? 5 : level === 3 ? 3 : 0)),
  );
}
export const sourceNoteColorKeys = ['gold', 'white', 'green', 'blue', 'rose', 'violet'] as const;
export function isTodoChecked(line: string): boolean {
  return /^\[x\]/i.test(line.trimStart());
}
export function cleanTodoLine(line: string): string {
  return line.trimStart().replace(/^\[(?:x| )\]\s*/i, '');
}
export function noteDisplayTitle(note: { title: string; note: string }, fallback: string): string {
  return (
    note.title.trim() ||
    cleanTodoLine(note.note.split(/\r?\n/).find((line) => line.trim()) ?? '') ||
    fallback
  );
}
export function noteExcerpt(note: { title: string; note: string }): string {
  const lines = note.note.split(/\r?\n/).filter((line) => line.trim());
  return (note.title.trim() ? lines : lines.slice(1)).map(cleanTodoLine).join(' ');
}
