export function requireSecurePkce() {
  if (
    !globalThis.crypto?.getRandomValues ||
    !globalThis.crypto?.subtle?.digest ||
    typeof TextEncoder === 'undefined'
  )
    throw new Error('Secure authentication is unavailable');
}
