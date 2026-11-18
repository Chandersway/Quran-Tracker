type DraftSession = {
  access_token: string;
  user: { id: string; user_metadata?: Record<string, unknown> };
};

/** Internal adapter snapshot. Credentials never enter feature/UI state or returned DTOs. */
export async function captureDraftActor(
  session: () => Promise<DraftSession | null>,
  expectedUserId?: string,
) {
  const current = await session();
  if (!current || (expectedUserId !== undefined && current.user.id !== expectedUserId))
    throw new Error('AUTH_REQUIRED');
  return {
    userId: current.user.id,
    accessToken: current.access_token,
    displayName:
      typeof current.user.user_metadata?.display_name === 'string'
        ? current.user.user_metadata.display_name
        : null,
  };
}
