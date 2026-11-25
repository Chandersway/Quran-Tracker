export type LayoutDirection = 'ltr' | 'rtl';

/** App language owns UI direction; no device-level RTL switch or app restart is needed. */
export function layoutDirection(language: string): LayoutDirection {
  return language === 'ar' ? 'rtl' : 'ltr';
}

/** Only semantic navigation icons mirror. Book geometry and media transport stay physical. */
export function mirroredIconScale(language: string, mirrorInRtl: boolean): 1 | -1 {
  return mirrorInRtl && layoutDirection(language) === 'rtl' ? -1 : 1;
}

/** Both native and web scroll surfaces use physical LTR x; the choices inside may be RTL. */
export function selectedOptionScrollX(
  option: { x: number; width: number },
  viewportWidth: number,
  contentWidth: number,
): number {
  return Math.max(
    0,
    Math.min(contentWidth - viewportWidth, option.x + (option.width - viewportWidth) / 2),
  );
}
