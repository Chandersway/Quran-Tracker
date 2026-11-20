/** Map a physical rail position to an exact page. Page one is at the right. */
export function pageAtRailPosition(x: number, width: number, maximum: number): number {
  if (width <= 0 || maximum <= 1) return 1;
  const position = Math.max(0, Math.min(1, x / width));
  return Math.round(1 + (1 - position) * (maximum - 1));
}

export function railPositionForPage(page: number, maximum: number): number {
  if (maximum <= 1) return 1;
  return 1 - (Math.max(1, Math.min(maximum, page)) - 1) / (maximum - 1);
}

export function tickForPage(page: number, maximum: number, tickCount: number): number {
  return Math.round(railPositionForPage(page, maximum) * (tickCount - 1));
}

/** Inclusive ranges use exactly the same nearest-tick mapping as the highlight. */
export function tickPageRanges(
  maximum: number,
  tickCount: number,
): { firstPage: number; lastPage: number }[] {
  const ranges = Array.from({ length: tickCount }, () => ({ firstPage: maximum, lastPage: 1 }));
  for (let page = 1; page <= maximum; page++) {
    const range = ranges[tickForPage(page, maximum, tickCount)]!;
    range.firstPage = Math.min(range.firstPage, page);
    range.lastPage = Math.max(range.lastPage, page);
  }
  return ranges;
}
