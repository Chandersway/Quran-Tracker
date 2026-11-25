import { PDFDocument } from 'pdf-lib';
import { STANDARD_PDF_CROP } from './mushafCrop';

export type PdfBox = { x: number; y: number; width: number; height: number };
// JS parsing holds the original and derived buffers together. Larger books open
// immediately unless the installed native worker can prepare them without JS buffers.
export const MAX_AUTOMATIC_PDF_CROP_BYTES = 32 * 1024 * 1024;
export function shouldAutomaticallyCropPdf(bytes: number, nativeAvailable: boolean): boolean {
  return nativeAvailable || bytes <= MAX_AUTOMATIC_PDF_CROP_BYTES;
}
/** PDF coordinates start at the lower left; the source crop is expressed in visible orientation. */
export function croppedPdfBox(box: PdfBox, rotation = 0): PdfBox {
  const turns = ((rotation % 360) + 360) % 360;
  const crop = STANDARD_PDF_CROP;
  const margins =
    turns === 90
      ? { left: crop.top, right: crop.bottom, bottom: crop.left, top: crop.right }
      : turns === 180
        ? { left: crop.right, right: crop.left, bottom: crop.top, top: crop.bottom }
        : turns === 270
          ? { left: crop.bottom, right: crop.top, bottom: crop.right, top: crop.left }
          : { left: crop.left, right: crop.right, bottom: crop.bottom, top: crop.top };
  return {
    x: box.x + box.width * margins.left,
    y: box.y + box.height * margins.bottom,
    width: box.width * (1 - margins.left - margins.right),
    height: box.height * (1 - margins.bottom - margins.top),
  };
}

/** Change page clipping only: images/text are neither rasterized nor recompressed. */
export async function cropPdfBytes(bytes: Uint8Array, signal?: AbortSignal): Promise<Uint8Array> {
  const check = () => {
    if (signal?.aborted) throw new Error('PDF preparation cancelled');
  };
  check();
  const document = await PDFDocument.load(bytes, { parseSpeed: 100, updateMetadata: false });
  check();
  for (const [index, page] of document.getPages().entries()) {
    const box = croppedPdfBox(page.getCropBox(), page.getRotation().angle);
    page.setCropBox(box.x, box.y, box.width, box.height);
    // Pdfium and PDFKit both use the cropped page as the native zoom/pan boundary.
    page.setMediaBox(box.x, box.y, box.width, box.height);
    if (index % 50 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      check();
    }
  }
  const result = await document.save({ objectsPerTick: 100, updateFieldAppearances: false });
  check();
  return result;
}
