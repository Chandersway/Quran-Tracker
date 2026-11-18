import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareNotesFile(json: string, fileName: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  await file.write(json, { encoding: 'utf8' });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable on this device');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: fileName,
    UTI: 'public.json',
  });
}
