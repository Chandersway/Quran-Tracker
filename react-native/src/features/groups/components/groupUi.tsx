import { createContext, useContext, useEffect, useRef, useState, type DependencyList } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { useI18n } from '../../../i18n';
import type { Group } from '../../../services/backend/types';
import type { GroupUpload } from '../../../services/groups/groupTypes';
import { Button, Notice, T } from '../../../shared/components';
import { groupErrorKey } from '../../../services/groups/groupErrors';

export const permitted = (group: Group, permission: string): boolean =>
  group.permissions?.includes(permission) === true;
/** Refresh remote resources without remounting forms or discarding unsent drafts. */
export const GroupRefreshContext = createContext(0);
export function groupError(error: unknown, fallback: string, t: (key: string) => string): string {
  return t(groupErrorKey(error) ?? fallback);
}
export function useGroupResource<T>(
  load: () => Promise<T>,
  dependencies: DependencyList,
  initial: T,
) {
  const { t } = useI18n();
  const refreshRevision = useContext(GroupRefreshContext);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = useRef(true);
  const generation = useRef(0);
  const loader = useRef(load);
  loader.current = load;
  async function reload() {
    const request = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const result = await loader.current();
      if (current.current && generation.current === request) setValue(result);
    } catch (reason) {
      if (current.current && generation.current === request)
        setError(groupError(reason, 'groups.error.network', t));
    } finally {
      if (current.current && generation.current === request) setBusy(false);
    }
  }
  async function run(
    action: () => Promise<unknown>,
    fallback = 'groups.error.network',
    refresh = true,
  ) {
    setBusy(true);
    setError('');
    try {
      await action();
      if (current.current && refresh) await reload();
    } catch (reason) {
      if (current.current) setError(groupError(reason, fallback, t));
    } finally {
      if (current.current) setBusy(false);
    }
  }
  useEffect(() => {
    current.current = true;
    void reload();
    return () => {
      current.current = false;
      generation.current++;
    };
  }, [refreshRevision, ...dependencies]);
  return { value, setValue, busy, error, setError, reload, run };
}
export function ResourceState({
  busy,
  error,
  onRetry,
}: {
  busy: boolean;
  error: string;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  return (
    <>
      {busy ? <T muted>{t('common.loading')}</T> : null}
      {error ? <Notice message={error} error onRetry={onRetry} /> : null}
    </>
  );
}
export function ConfirmAction({
  title,
  body,
  action,
  disabled = false,
}: {
  title: string;
  body: string;
  action: () => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Button
      title={title}
      variant="danger"
      disabled={disabled}
      onPress={() => {
        if (Platform.OS === 'web') {
          if (globalThis.confirm(t(body))) action();
        } else
          Alert.alert(t(title), t(body), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.confirm'), style: 'destructive', onPress: action },
          ]);
      }}
    />
  );
}
export async function chooseGroupImage(square = false): Promise<GroupUpload | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: square,
    aspect: square ? [1, 1] : undefined,
    quality: 0.9,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const bytes =
    Platform.OS === 'web'
      ? new Uint8Array(await (await fetch(asset.uri)).arrayBuffer())
      : await new File(asset.uri).bytes();
  return {
    bytes,
    mimeType: asset.mimeType || 'image/jpeg',
    fileName: asset.fileName || 'photo.jpg',
    width: asset.width,
    height: asset.height,
  };
}
