export type AudioQueueCursor = { index: number; round: number; rounds: number };

/** Queue rounds: zero repeats forever, one plays once, positive N repeats N times. */
export function nextAudioQueueCursor(
  cursor: AudioQueueCursor,
  length: number,
): AudioQueueCursor | null {
  if (
    !Number.isInteger(length) ||
    length < 0 ||
    !Number.isInteger(cursor.index) ||
    !Number.isInteger(cursor.round) ||
    !Number.isInteger(cursor.rounds) ||
    cursor.round < 1 ||
    cursor.rounds < 0
  ) {
    throw new RangeError('Invalid audio queue cursor');
  }
  if (length === 0 || cursor.index >= length) return null;
  if (cursor.index + 1 < length) return { ...cursor, index: cursor.index + 1 };
  if (cursor.rounds === 0 || cursor.round < cursor.rounds)
    return { ...cursor, index: 0, round: cursor.round + 1 };
  return null;
}
