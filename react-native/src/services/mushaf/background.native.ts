import { AppState, NativeModules } from 'react-native';
import type { BackgroundMushafPort } from './backgroundTypes';

const native: BackgroundMushafPort | undefined = NativeModules.BackgroundMushafDownloads;
function moduleFor(): BackgroundMushafPort {
  if (!native)
    throw new Error(
      'Persistent Mushaf downloads require a native rebuild with withBackgroundMushafDownloads.',
    );
  return native;
}
export const backgroundMushafPort: BackgroundMushafPort = {
  inspect: () => moduleFor().inspect(),
  start: (edition) => moduleFor().start(edition),
  cancel: (id) => moduleFor().cancel(id),
  onResume(listener) {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') listener();
    });
    return () => subscription.remove();
  },
};
