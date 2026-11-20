export type DraftStatus = 'idle' | 'sending' | 'failed' | 'sent';
export type GroupDraft = { text: string; status: DraftStatus };
export type GroupDraftState = { post: GroupDraft; comments: Record<string, GroupDraft> };
const empty = (): GroupDraft => ({ text: '', status: 'idle' });

/** Session memory deliberately retains private, unsent text without writing it to disk. */
export class GroupDraftStore {
  constructor(readonly accountId?: string) {}
  private state: GroupDraftState = { post: empty(), comments: {} };
  private listeners = new Set<() => void>();
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private draft(postId?: string) {
    return postId ? (this.state.comments[postId] ?? empty()) : this.state.post;
  }
  private update(draft: GroupDraft, postId?: string) {
    this.state = postId
      ? { ...this.state, comments: { ...this.state.comments, [postId]: draft } }
      : { ...this.state, post: draft };
    this.listeners.forEach((listener) => listener());
  }
  set(text: string, postId?: string) {
    this.update(
      { text, status: this.draft(postId).status === 'sending' ? 'sending' : 'idle' },
      postId,
    );
  }
  async send(
    action: (text: string, expectedUserId?: string) => Promise<unknown>,
    postId?: string,
  ): Promise<boolean> {
    const draft = this.draft(postId);
    if (draft.status === 'sending' || !draft.text.trim()) return false;
    this.update({ ...draft, status: 'sending' }, postId);
    try {
      await action(draft.text, this.accountId);
      const current = this.draft(postId);
      // A user may keep typing while a slow request completes. Clear only the sent snapshot.
      this.update(
        {
          text: current.text === draft.text ? '' : current.text,
          status: current.text === draft.text ? 'sent' : 'idle',
        },
        postId,
      );
      return true;
    } catch {
      this.update({ text: this.draft(postId).text, status: 'failed' }, postId);
      return false;
    }
  }
}
const stores = new Map<string, GroupDraftStore>();
export function groupDrafts(accountId: string, groupCode: string): GroupDraftStore {
  return scopedDrafts(accountId, groupCode, 'feed');
}
/** A chat draft never overwrites the independent post/reply composer. */
export function groupChatDrafts(accountId: string, groupCode: string): GroupDraftStore {
  return scopedDrafts(accountId, groupCode, 'chat');
}
function scopedDrafts(accountId: string, groupCode: string, surface: 'feed' | 'chat') {
  const key = JSON.stringify([accountId, groupCode.trim().toUpperCase(), surface]);
  let store = stores.get(key);
  if (!store) {
    store = new GroupDraftStore(accountId);
    stores.set(key, store);
  }
  return store;
}
