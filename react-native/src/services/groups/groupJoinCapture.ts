import { Linking } from 'react-native';
import { pendingGroup } from './pendingGroup';

// Capture before fonts/onboarding mount. A verified post destination is not a pending invitation.
function capture(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has('postId') && !parsed.searchParams.has('invite'))
      return Promise.resolve(null);
  } catch {
    return Promise.resolve(null);
  }
  return pendingGroup.receive(url);
}
export const groupJoinCaptureReady = Linking.getInitialURL()
  .then((url) => (url ? capture(url) : null))
  .catch(() => null);
Linking.addEventListener('url', (event) => {
  void capture(event.url).catch(() => undefined);
});
