import {
  GROUP_TYPING_TTL_MS,
  type GroupTypingParticipant,
  type GroupTypingService,
  type GroupTypingSignal,
  type GroupTypingTransport,
} from './groupTyping';

export const GROUP_TYPING_IDLE_MS = 2_000;
export const GROUP_TYPING_THROTTLE_MS = 3_000;
type Clock = {
  now(): number;
  every(callback: () => void, milliseconds: number): () => void;
};
const realClock: Clock = {
  now: () => Date.now(),
  every(callback, milliseconds) {
    const timer = setInterval(callback, milliseconds);
    return () => clearInterval(timer);
  },
};
const empty: readonly GroupTypingParticipant[] = [];

/** Per-account, per-group UI lifetime. No draft text, storage, online state or replay. */
export class GroupTypingController {
  private transport?: GroupTypingTransport;
  private stopTimer?: () => void;
  private generation = 0;
  private focused = false;
  private ready = false;
  private typing = false;
  private sentTyping = false;
  private lastActivity = 0;
  private lastPublish = -Infinity;
  private signals = new Map<string, GroupTypingSignal>();
  private order = new Map<string, number>();
  private value = empty;
  private listeners = new Set<() => void>();

  constructor(
    private service: GroupTypingService,
    private code: string,
    private accountId: string,
    private canSend: boolean,
    private clock: Clock = realClock,
  ) {}
  snapshot = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private update() {
    const next = [...this.signals.values()]
      .sort((a, b) => a.userId.localeCompare(b.userId))
      .map(({ userId, displayName }) => ({ userId, displayName }));
    if (
      next.length === this.value.length &&
      next.every(
        (item, index) =>
          item.userId === this.value[index]?.userId &&
          item.displayName === this.value[index]?.displayName,
      )
    )
      return;
    this.value = next.length ? next : empty;
    for (const listener of this.listeners) listener();
  }
  private receive(signal: GroupTypingSignal) {
    const now = this.clock.now();
    const order = signal.order ?? signal.expiresAt;
    const previous = this.order.get(signal.userId) ?? -Infinity;
    if (
      signal.userId === this.accountId ||
      order < previous ||
      (order === previous && signal.typing) ||
      signal.expiresAt > now + GROUP_TYPING_TTL_MS + 2_000
    )
      return;
    this.order.set(signal.userId, order);
    if (signal.typing && signal.expiresAt > now)
      this.signals.set(signal.userId, {
        ...signal,
        expiresAt: Math.min(signal.expiresAt, now + GROUP_TYPING_TTL_MS),
      });
    else this.signals.delete(signal.userId);
    this.update();
  }
  start() {
    if (this.transport || !this.accountId) return;
    const generation = ++this.generation;
    this.transport = this.service.connectTyping(
      this.code,
      this.accountId,
      (signal) => {
        if (generation === this.generation) this.receive(signal);
      },
      (ready) => {
        if (generation !== this.generation) return;
        this.ready = ready;
        if (!ready) {
          this.sentTyping = false;
          this.signals.clear();
          this.update();
        }
      },
    );
    this.stopTimer = this.clock.every(() => this.tick(), 250);
  }
  stop() {
    this.clear();
    this.generation++;
    this.transport?.close();
    this.transport = undefined;
    this.stopTimer?.();
    this.stopTimer = undefined;
    this.ready = false;
    this.focused = false;
    this.signals.clear();
    this.order.clear();
    this.update();
  }
  setCanSend(value: boolean) {
    this.canSend = value;
    if (!value) this.clear();
  }
  focus = () => {
    this.focused = true;
  };
  blur = () => {
    this.focused = false;
    this.clear();
  };
  activity = (hasText: boolean) => {
    if (!hasText || !this.focused || !this.canSend || !this.transport) {
      this.clear();
      return;
    }
    this.lastActivity = this.clock.now();
    this.typing = true;
    this.tick();
  };
  clear = () => {
    this.typing = false;
    if (this.sentTyping) this.publish(false);
  };
  private publish(value: boolean) {
    if (!this.transport || !this.ready) return;
    this.sentTyping = value;
    this.lastPublish = this.clock.now();
    void this.transport.publish(value).catch(() => undefined);
  }
  private tick() {
    const now = this.clock.now();
    for (const [id, signal] of this.signals) if (signal.expiresAt <= now) this.signals.delete(id);
    this.update();
    if (this.typing && now - this.lastActivity >= GROUP_TYPING_IDLE_MS) this.clear();
    if (
      this.typing &&
      this.focused &&
      this.canSend &&
      this.ready &&
      (!this.sentTyping || now - this.lastPublish >= GROUP_TYPING_THROTTLE_MS)
    )
      this.publish(true);
  }
}
