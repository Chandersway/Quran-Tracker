import { curatedReplyText } from './notification-copy.ts';

export type ApnsDelivery = {
  token: string; event_id: string; recipient: string; group_code: string; post_id: string; language: string;
};
export type ApnsAuth = { token: string; topic: string; host: string };

export function buildApnsRequest(delivery: ApnsDelivery, auth: ApnsAuth) {
  return {
    url: `${auth.host}/3/device/${encodeURIComponent(delivery.token)}`,
    headers: {
      Authorization: `bearer ${auth.token}`,
      "apns-topic": auth.topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "Content-Type": "application/json",
    },
    body: {
      aps: { alert: curatedReplyText(delivery.language), sound: "default" },
      kind: "group_reply",
      event_id: delivery.event_id,
      recipient: delivery.recipient,
      group_code: delivery.group_code,
      post_id: delivery.post_id,
    },
  };
}

export function apnsOutcome(status: number, reason: string) {
  if (status >= 200 && status < 300) return { outcome: "sent", reset: false } as const;
  if (status === 410 && reason === "Unregistered") return { outcome: "invalid_token", reset: false } as const;
  return { outcome: status === 429 || status >= 500 || status === 403 ? "retry" : "failed", reset: status === 403 } as const;
}
