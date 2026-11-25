export type AppleSignInButtonProps = {
  disabled: boolean;
  loading: boolean;
  onPress(): void;
};

/** Native Apple authentication is intentionally absent from Android and web. */
export function AppleSignInButton(_props: AppleSignInButtonProps) {
  return null;
}
