import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

export async function pickNotesFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset || (asset.size ?? 0) > 10 * 1024 * 1024) throw new Error('notes-import-too-large');
  const file = new File(asset.uri);
  if (file.size > 10 * 1024 * 1024) throw new Error('notes-import-too-large');
  return file.text();
}
