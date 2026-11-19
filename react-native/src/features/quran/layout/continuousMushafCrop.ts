import { pageSegments, type Edition } from '../../../content/mushafGeometry';

/** Trim the outer Medina frame, retaining every mapped ayah and the heading area.
 * Other sources retain their own already-verified crop instead of borrowing Medina's frame. */
export function continuousMushafCrop(edition: Edition, page: number) {
  if (edition !== 'hafs') return { left: 0, right: 0, top: 0, bottom: 0 };
  const bounds = { left: 0.06, right: 0.06, top: page <= 2 ? 0.02 : 0.04, bottom: 0.04 };
  for (const row of pageSegments(edition, page, 'original')) {
    bounds.left = Math.min(bounds.left, Math.max(0, row.x - 0.005));
    bounds.right = Math.min(bounds.right, Math.max(0, 1 - row.x - row.width - 0.005));
    bounds.top = Math.min(bounds.top, Math.max(0, row.y - 0.005));
    bounds.bottom = Math.min(bounds.bottom, Math.max(0, 1 - row.y - row.height - 0.005));
  }
  return bounds;
}
