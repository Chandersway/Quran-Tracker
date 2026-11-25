import { useEffect, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import type { ProfileAccount, ProfileService } from '../../../services/profiles/types';

type Feedback = {
  profileName: string;
  profileSaved: string;
  avatarSaved: string;
};

/** Profile editing owns its request lifetime; account changes discard stale completions. */
export function useAccountProfile({
  profiles,
  account,
  messages,
  errorMessage,
  setError,
  setNotice,
}: {
  profiles: ProfileService | undefined;
  account: ProfileAccount | null;
  messages: Feedback;
  errorMessage: (error: unknown) => string;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
}) {
  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const lifetime = useRef(0);
  const editing = useRef(0);
  const avatarRevision = useRef(0);
  const pending = useRef(false);

  useEffect(() => {
    const request = ++lifetime.current;
    pending.current = false;
    setProfileBusy(false);
    editing.current = 0;
    avatarRevision.current = 0;
    if (!account || !profiles) {
      setProfileName('');
      setAvatarUrl(null);
    } else {
      setProfileName(account.displayName);
      setAvatarUrl(account.avatarUrl);
      void profiles.load(account).then((profile) => {
        if (request !== lifetime.current) return;
        if (!editing.current) setProfileName(profile.displayName);
        if (!avatarRevision.current) setAvatarUrl(profile.avatarUrl);
      });
    }
    return () => {
      ++lifetime.current;
    };
  }, [profiles, account?.id]);

  function changeProfileName(value: string) {
    ++editing.current;
    setProfileName(value);
  }

  async function updateProfile(choosePhoto: boolean) {
    if (!profiles || !account || pending.current) return;
    if (!choosePhoto && !profileName.trim()) {
      setError(messages.profileName);
      return;
    }
    const request = lifetime.current;
    pending.current = true;
    setProfileBusy(true);
    setError('');
    setNotice('');
    // Hydration can still restore an existing photo while the name is being edited.
    const submittedEdit = ++editing.current;
    try {
      let photo: DocumentPicker.DocumentPickerAsset | undefined;
      if (choosePhoto) {
        const picked = await DocumentPicker.getDocumentAsync({
          type: ['image/jpeg', 'image/png', 'image/webp'],
          copyToCacheDirectory: true,
        });
        if (picked.canceled || !picked.assets[0] || request !== lifetime.current) return;
        photo = picked.assets[0];
      }
      if (photo) {
        const profile = await profiles.saveAvatar(account, profileName, photo);
        if (request !== lifetime.current) return;
        ++avatarRevision.current;
        if (submittedEdit === editing.current) setProfileName(profile.displayName);
        setAvatarUrl(profile.avatarUrl);
        setNotice(messages.avatarSaved);
      } else {
        const displayName = await profiles.saveName(account.id, profileName);
        if (request !== lifetime.current) return;
        if (submittedEdit === editing.current) setProfileName(displayName);
        setNotice(messages.profileSaved);
      }
    } catch (error) {
      if (request === lifetime.current) setError(errorMessage(error));
    } finally {
      if (request === lifetime.current) {
        pending.current = false;
        setProfileBusy(false);
      }
    }
  }

  return {
    profileName,
    setProfileName: changeProfileName,
    avatarUrl,
    profileBusy,
    saveProfile: () => updateProfile(false),
    chooseAvatar: () => updateProfile(true),
  };
}
