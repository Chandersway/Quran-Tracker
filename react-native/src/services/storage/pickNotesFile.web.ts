import * as DocumentPicker from 'expo-document-picker';

export async function pickNotesFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    base64: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset?.uri?.startsWith('blob:')) URL.revokeObjectURL(asset.uri);
  if (!asset?.file || asset.file.size > 10 * 1024 * 1024) throw new Error('notes-import-too-large');
  return asset.file.text();
}
