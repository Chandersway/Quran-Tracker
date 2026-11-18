export type RevealBounds = { top: number; height: number };
export type RevealViewport = { offset: number; height: number };

/** Bottom entry and the flat threshold, expressed as scroll offsets. */
export function revealScrollRange(
  bounds: RevealBounds,
  viewportHeight: number,
): [number, number, number, number] | null {
  if (
    ![bounds.top, bounds.height, viewportHeight].every(Number.isFinite) ||
    bounds.height <= 0 ||
    viewportHeight <= 0
  )
    return null;
  const start = bounds.top - viewportHeight * 1.5;
  const edge = bounds.top - viewportHeight;
  const flatTop = Math.max(viewportHeight * 0.72, viewportHeight - bounds.height);
  const flat = bounds.top - flatTop;
  return [start, edge, flat, Math.max(flat, bounds.top + bounds.height)];
}
/** Translation endpoints for staged real card tops; the viewport clips below its edge. */
export function revealTranslation(
  bounds: RevealBounds,
  viewportHeight: number,
): [number, number, number] | null {
  if (!revealScrollRange(bounds, viewportHeight)) return null;
  const flatTop = Math.max(viewportHeight * 0.72, viewportHeight - bounds.height);
  const stageTop = Math.max(viewportHeight * 0.84, flatTop + (viewportHeight - flatTop) * 0.2);
  const distantTop = Math.min(viewportHeight, stageTop + viewportHeight * 0.04);
  return [distantTop - viewportHeight * 1.5, stageTop - viewportHeight, 0];
}
/** Cards become interactive once the staged face is visible, even before it is flat. */
export function revealIsInteractive(bounds: RevealBounds, viewport: RevealViewport): boolean {
  const range = revealScrollRange(bounds, viewport.height);
  return (
    !range ||
    !Number.isFinite(viewport.offset) ||
    viewport.offset >= range[0] + viewport.height * 0.1
  );
}
/** Equivalent of the native interpolation for validating hold, reverse and viewport changes. */
export function revealProgressAt(bounds: RevealBounds, viewport: RevealViewport): number | null {
  const range = revealScrollRange(bounds, viewport.height);
  if (!range || !Number.isFinite(viewport.offset)) return null;
  const [, edge, flat] = range;
  const y = viewport.offset;
  if (y <= edge) return 0;
  if (y < flat) return (y - edge) / (flat - edge);
  return 1;
}
