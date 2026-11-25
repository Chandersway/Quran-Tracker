import { NativeModules, Platform } from 'react-native';
import { runNativePdfCrop, type NativePdfCropModule } from './pdfCropTypes';

let serial = 0;
function moduleFor(): NativePdfCropModule | null {
  const module = NativeModules.MushafPdfCrop as NativePdfCropModule | undefined;
  return Platform.OS === 'android' &&
    module?.protocolVersion === 1 &&
    typeof module.prepare === 'function' &&
    typeof module.cancel === 'function'
    ? module
    : null;
}

export function nativePdfCropAvailable(): boolean {
  return moduleFor() !== null;
}

/** false means an older shell/iOS may use the JS fallback; worker errors remain errors. */
export function prepareNativePdfCrop(
  sourceUri: string,
  destinationUri: string,
  signal: AbortSignal,
): Promise<boolean> {
  const jobId = `pdf_${Date.now()}_${++serial}`;
  return runNativePdfCrop(moduleFor(), sourceUri, destinationUri, signal, jobId);
}
