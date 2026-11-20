/** Phones in landscape need width-fitted scrolling pages; only real tablets use spreads. */
export function isShortLandscape(width: number, height: number): boolean {
  return width > height && Math.min(width, height) < 600;
}
export function useBookSpread(
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  return Math.min(width, height) >= 600 && viewportWidth >= 760 && viewportWidth > viewportHeight;
}
