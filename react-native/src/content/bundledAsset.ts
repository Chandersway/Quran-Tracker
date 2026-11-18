import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

/** Reads a statically bundled JSON asset on native or web without a runtime API call. */
export async function readBundledJson(moduleId: number): Promise<unknown> {
  const asset = await Asset.fromModule(moduleId).downloadAsync();
  const json = asset.localUri
    ? await new File(asset.localUri).text()
    : await (async () => {
        const response = await fetch(asset.uri);
        if (!response.ok) throw new Error(`Bundled asset unavailable (${response.status})`);
        return response.text();
      })();
  return JSON.parse(json) as unknown;
}
