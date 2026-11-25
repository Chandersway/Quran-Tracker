/** Provider-neutral identity and editable community profile. */
export type ProfileAccount = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
};
export type Profile = { displayName: string; avatarUrl: string | null };
export type ProfilePhoto = { uri: string; mimeType?: string | null };

export type ProfileService = {
  /** Online custom fields take precedence, then this account's saved fields and identity. */
  load(account: ProfileAccount): Promise<Profile>;
  /** Update the display name without touching a photo that may not be hydrated yet. */
  saveName(accountId: string, displayName: string): Promise<string>;
  saveAvatar(account: ProfileAccount, displayName: string, photo: ProfilePhoto): Promise<Profile>;
  /** Account deletion clears only this actor's cached profile; normal sign-out preserves it. */
  clearCache(accountId: string): Promise<void>;
  /** Provider's one-time name may initialize an empty profile; a custom name always wins. */
  rememberProviderName(accountId: string, displayName: string): Promise<string | null>;
};
