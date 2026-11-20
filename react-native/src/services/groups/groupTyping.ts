export const GROUP_TYPING_TTL_MS = 8_000;
export type GroupTypingParticipant = { userId: string; displayName: string };
export type GroupTypingSignal = GroupTypingParticipant & {
  typing: boolean;
  expiresAt: number;
  order?: number;
};
export type GroupTypingTransport = {
  publish(typing: boolean): Promise<void>;
  close(): void;
};
export type GroupTypingService = {
  connectTyping(
    code: string,
    expectedUserId: string,
    onSignal: (signal: GroupTypingSignal) => void,
    onReady: (ready: boolean) => void,
  ): GroupTypingTransport;
};
export type GroupTypingScope = {
  groupId: string;
  topic: string;
  members: GroupTypingParticipant[];
  clockOffsetMs?: number;
};
export type GroupTypingPort = {
  resolve(code: string, expectedUserId: string): Promise<GroupTypingScope>;
  open(
    topic: string,
    expectedUserId: string,
    onPayload: (payload: unknown) => void,
    onReady: (ready: boolean) => void,
  ): () => void;
  publish(groupId: string, expectedUserId: string, typing: boolean): Promise<void>;
  onActorChange(expectedUserId: string, close: () => void): () => void;
};

/** Private transport only. Identity/expiry originate in the server RPC, never a peer payload. */
export function createGroupTypingService(port: GroupTypingPort): GroupTypingService {
  return {
    connectTyping(code, expectedUserId, onSignal, onReady) {
      let closed = false;
      let ready = false;
      let scope: GroupTypingScope | undefined;
      let closeChannel: (() => void) | undefined;
      let stopAuth: (() => void) | undefined;
      let refreshTimer: ReturnType<typeof setInterval> | undefined;
      let refreshing = false;
      let requestedTyping = false;
      let writes: Promise<void> | undefined;
      let pendingWrite: boolean | undefined;
      const publish = (typing: boolean) => {
        if (closed || (typing && !ready) || !scope) return Promise.resolve();
        const groupId = scope.groupId;
        requestedTyping = typing;
        // One in-flight request plus one coalesced desired state, even on a slow
        // network. Blur/send cannot be overtaken by an older start request.
        pendingWrite = typing;
        writes ??= (async () => {
          let failure: unknown;
          try {
            while (pendingWrite !== undefined) {
              const value = pendingWrite;
              pendingWrite = undefined;
              try {
                await port.publish(groupId, expectedUserId, value);
              } catch (error) {
                failure = error;
              }
            }
            if (failure) throw failure;
          } finally {
            writes = undefined;
          }
        })();
        return writes;
      };
      const close = () => {
        if (closed) return;
        // Receiving may already be disconnected. A queued start must never run
        // after disposal; the pinned stop still follows an in-flight request.
        if (pendingWrite === true) pendingWrite = undefined;
        if (requestedTyping) void publish(false).catch(() => undefined);
        closed = true;
        ready = false;
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = undefined;
        closeChannel?.();
        closeChannel = undefined;
        stopAuth?.();
        stopAuth = undefined;
        onReady(false);
      };
      const refresh = async () => {
        if (closed || refreshing) return;
        refreshing = true;
        try {
          const next = await port.resolve(code, expectedUserId);
          if (closed) return;
          if (scope && (next.groupId !== scope.groupId || next.topic !== scope.topic)) {
            close();
            return;
          }
          scope = next;
          if (!closeChannel) {
            closeChannel = port.open(
              next.topic,
              expectedUserId,
              (value) => {
                if (closed || !ready || !scope || !value || typeof value !== 'object') return;
                const row = value as Record<string, unknown>;
                if (
                  typeof row.user_id !== 'string' ||
                  typeof row.typing !== 'boolean' ||
                  typeof row.expires_at !== 'string' ||
                  row.user_id === expectedUserId
                )
                  return;
                const member = scope.members.find((item) => item.userId === row.user_id);
                const order = Date.parse(row.expires_at);
                const expiresAt = order - (scope.clockOffsetMs ?? 0);
                if (!member || !Number.isFinite(expiresAt)) return;
                // Resolve names through authorized membership, not arbitrary event text.
                onSignal({ ...member, typing: row.typing, expiresAt, order });
              },
              (value) => {
                if (closed) return;
                ready = value;
                if (!value) {
                  if (pendingWrite === true) pendingWrite = undefined;
                  if (requestedTyping) void publish(false).catch(() => undefined);
                }
                onReady(value);
              },
            );
          }
        } catch {
          // Missing hosted migration, expired membership or network failure must
          // never break reading/sending messages or downgrade to a public channel.
          close();
        } finally {
          refreshing = false;
        }
      };
      if (!expectedUserId) {
        close();
        return { publish, close };
      }
      stopAuth = port.onActorChange(expectedUserId, close);
      if (closed) {
        stopAuth();
        return { publish, close };
      }
      refreshTimer = setInterval(() => void refresh(), 30_000);
      void refresh();
      return { publish, close };
    },
  };
}
