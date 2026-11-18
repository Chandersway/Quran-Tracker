import type { GroupFeedConnection } from '../backend/types';

export type GroupFeedSubscriptionPort = {
  groupId(code: string): Promise<string>;
  open(
    groupId: string,
    change: () => void,
    status: (value: GroupFeedConnection) => void,
  ): () => void;
};

/** Handles leaving a group before its asynchronous authorization lookup finishes. */
export function createGroupFeedSubscription(port: GroupFeedSubscriptionPort) {
  return (code: string, change: () => void, status: (value: GroupFeedConnection) => void) => {
    let active = true;
    let close: (() => void) | undefined;
    status('connecting');
    void port
      .groupId(code)
      .then((id) => {
        if (!active) return;
        close = port.open(
          id,
          () => {
            if (active) change();
          },
          (value) => {
            if (active) status(value);
          },
        );
      })
      .catch(() => {
        if (active) status('polling');
      });
    return () => {
      active = false;
      close?.();
      close = undefined;
    };
  };
}
