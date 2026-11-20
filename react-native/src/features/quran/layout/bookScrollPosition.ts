const finite = (value: number) => (Number.isFinite(value) ? value : 0);

/** Source-relative position, independent of fullscreen controls and orientation. */
export function bookScrollAnchor(offset: number, bookHeight: number, topGutter: number): number {
  if (!Number.isFinite(bookHeight) || bookHeight <= 0) return 0;
  return Math.max(0, Math.min(1, (finite(offset) - finite(topGutter)) / bookHeight));
}

export function bookOffsetForAnchor(
  anchor: number,
  bookHeight: number,
  topGutter: number,
  bottomGutter: number,
  viewportHeight: number,
): number {
  const maximum = Math.max(
    0,
    finite(bookHeight) + finite(topGutter) + finite(bottomGutter) - finite(viewportHeight),
  );
  // At the top retain the full heading/gutter rather than hiding it behind controls.
  const position =
    anchor > 0
      ? Math.max(0, Math.min(1, finite(anchor))) * finite(bookHeight) + finite(topGutter)
      : 0;
  return Math.max(0, Math.min(maximum, position));
}
