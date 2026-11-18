import {
  SELECTABLE_MUSHAF,
  type SelectableMushafLine,
  type SelectableMushafPageData,
  type SelectableMushafToken,
} from './selectableMushaf';

// The same QPC Unicode basmallah used by the existing page surface.
export const SELECTABLE_BASMALLAH = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
export type SelectablePagePart = {
  text: string;
  start: number;
  end: number;
  token?: SelectableMushafToken;
};
export type SelectablePageTextLine = {
  number: number;
  kind: SelectableMushafLine['kind'];
  text: string;
  start: number;
  end: number;
  parts: SelectablePagePart[];
};
export type SelectablePageText = { text: string; lines: SelectablePageTextLine[] };

/** Window and onLayout floats can differ while occupying the same native pixels. */
export function selectablePageLayoutKey(
  page: number,
  width: number,
  height: number,
  attempt: number,
  density: number,
): string {
  return `${page}:${Math.round(width * density)}:${Math.round(height * density)}:${attempt}:${density}`;
}

/** One native selection buffer: prescribed Hafs slots or honestly reconstructed Warsh rows. */
export function selectablePageText(
  page: SelectableMushafPageData,
  surahName: (surah: number) => string,
): SelectablePageText {
  if (
    (page.edition === 'qpc_hafs_unicode'
      ? page.lines.length !== SELECTABLE_MUSHAF.linesPerPage
      : page.lines.length === 0) ||
    page.lines.some((line, index) => line.number !== index + 1)
  )
    throw new TypeError('Invalid prescribed Mushaf lines');
  let text = '';
  const lines = page.lines.map((line, index): SelectablePageTextLine => {
    if (index) text += '\n';
    const start = text.length;
    const content =
      line.kind === 'surah_name'
        ? line.surah
          ? surahName(line.surah)
          : ''
        : line.kind === 'basmallah'
          ? page.edition === 'warsh_unicode'
            ? line.text
            : SELECTABLE_BASMALLAH
          : line.kind === 'blank'
            ? ''
            : line.text;
    if (/[\r\n]/.test(content) || (line.kind === 'surah_name' && !content))
      throw new TypeError('Invalid prescribed Mushaf line text');
    const parts: SelectablePagePart[] = [];
    let cursor = 0;
    if (line.kind === 'ayah' || line.kind === 'basmallah') {
      for (const token of line.tokens) {
        if (
          token.start < cursor ||
          token.end <= token.start ||
          token.end > content.length ||
          content.slice(token.start, token.end) !== token.text
        )
          throw new TypeError('Invalid Mushaf token offsets');
        if (token.start > cursor)
          parts.push({
            text: content.slice(cursor, token.start),
            start: start + cursor,
            end: start + token.start,
          });
        parts.push({
          text: token.text,
          start: start + token.start,
          end: start + token.end,
          token,
        });
        cursor = token.end;
      }
    }
    if (cursor < content.length)
      parts.push({
        text: content.slice(cursor),
        start: start + cursor,
        end: start + content.length,
      });
    text += content;
    return { number: line.number, kind: line.kind, text: content, start, end: text.length, parts };
  });
  return { text, lines };
}

export type MeasuredSelectableLine = { text: string; width: number };

/** Verify real native line layout; never impose a line cap to conceal overflow. */
export function fitSelectablePageText(
  expected: SelectablePageText,
  rendered: readonly MeasuredSelectableLine[],
  availableWidth: number,
  scale: number,
): { status: 'verified' | 'resize' | 'expanded'; scale: number } {
  if (
    !Number.isFinite(availableWidth) ||
    availableWidth <= 0 ||
    !rendered.length ||
    rendered.some((line) => !Number.isFinite(line.width))
  )
    return { status: 'expanded', scale };
  const faithful =
    rendered.length === expected.lines.length &&
    rendered.every(
      (line, index) => line.text.replace(/\r?\n$/, '') === expected.lines[index]!.text,
    );
  const widest = Math.max(...rendered.map((line) => line.width));
  if (faithful && widest <= availableWidth + 1) return { status: 'verified', scale };
  const minimumScale = 0.35;
  if (scale <= minimumScale) return { status: 'expanded', scale };
  const ratio = widest > availableWidth + 1 ? Math.min(0.92, availableWidth / widest) : 0.92;
  return {
    status: 'resize',
    scale: Math.max(minimumScale, Math.floor(scale * ratio * 1000) / 1000),
  };
}
