import type { Edition, Segment } from '../../../content/mushafGeometry';

export const STANDARD_PDF_CROP = { left: 0.055, right: 0.055, top: 0.045, bottom: 0.055 } as const;
export const mushafCropZoom = (edition: Edition): number =>
  edition === 'hafs_maknoon' ? 1.15 : edition === 'warsh_maknoon' ? 1.12 : 1;

/** Source coordinates and artwork share a centered crop, followed by ordinary user zoom. */
export function cropSegment(segment: Segment, crop: number): Segment {
  const inset = (crop - 1) / 2;
  return {
    ...segment,
    x: segment.x * crop - inset,
    y: segment.y * crop - inset,
    width: segment.width * crop,
    height: segment.height * crop,
  };
}

export function uncropPoint(x: number, y: number, crop: number): { x: number; y: number } {
  const inset = (crop - 1) / 2;
  return { x: (x + inset) / crop, y: (y + inset) / crop };
}
