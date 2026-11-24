import { NativeModules, Platform } from 'react-native';

type QuranGoalWidgetModule = { update(json: string): Promise<void> };
const native: QuranGoalWidgetModule | undefined = NativeModules.QuranGoalWidget;

/** Stores the latest snapshot for the Android widget and redraws every placed instance. */
export function publishHomeWidget(json: string): Promise<void> {
  if (Platform.OS !== 'android' || !native) return Promise.resolve();
  return native.update(json);
}
