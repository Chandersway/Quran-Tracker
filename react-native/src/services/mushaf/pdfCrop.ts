import { runNativePdfCrop } from './pdfCropTypes';

export function nativePdfCropAvailable(): boolean {
  return false;
}
export function prepareNativePdfCrop(
  sourceUri: string,
  destinationUri: string,
  signal: AbortSignal,
): Promise<boolean> {
  return runNativePdfCrop(null, sourceUri, destinationUri, signal, 'unavailable');
}
