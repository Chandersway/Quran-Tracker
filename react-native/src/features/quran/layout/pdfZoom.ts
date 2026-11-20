export const PDF_MIN_ZOOM = 1;
export const PDF_MAX_ZOOM = 3;

/** Native zoom is a multiplier, never the ratio between portrait/landscape page widths. */
export function observedPdfZoom(value: number, current: number): number {
  if (!Number.isFinite(value) || value <= 0) return current;
  const next = Math.max(PDF_MIN_ZOOM, Math.min(PDF_MAX_ZOOM, value));
  return Math.abs(next - current) < 0.001 ? current : next;
}

export function stepPdfZoom(current: number, delta: number): number {
  return observedPdfZoom(current + delta, current);
}
