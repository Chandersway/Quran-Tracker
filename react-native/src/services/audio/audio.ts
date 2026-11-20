import { Directory, File, Paths } from 'expo-file-system';
import { loadAudioCatalogAsset } from '../../content/audioCatalog';
import { readBundledJson } from '../../content/bundledAsset';
import {
  mirroredAudioUrl,
  parseAudioCatalog,
  validateAyahTimings,
  type RawAudioOption,
} from './audio-catalog';
import type { AudioService, AudioTrack, AyahTiming } from '../backend/types';
import { downloadAudio, validMp3Header } from './audioDownload';

const downloads = new Map<string, Promise<string>>();

export function createAudioService(audioBaseUrl?: string): AudioService {
  function localFile(track: AudioTrack): File {
    const objectPath =
      track.objectPath?.replace(/^audio\//, '') ??
      `${track.reciterKey ?? track.reciterId}/${String(track.surah).padStart(3, '0')}${track.ayah !== undefined && track.startSeconds === undefined ? String(track.ayah).padStart(3, '0') : ''}.mp3`;
    const segments = objectPath.split('/');
    if (
      segments.some(
        (segment) =>
          !/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(segment) || segment === '.' || segment === '..',
      )
    )
      throw new RangeError('Invalid audio object path');
    const fileName = segments.pop();
    if (!fileName) throw new RangeError('Invalid audio object path');
    const directory = new Directory(Paths.document, 'audio', ...segments);
    return new File(directory, fileName);
  }
  function complete(file: File): string | null {
    try {
      if (
        !file.exists ||
        file.size <= 128 ||
        !new File(file.parentDirectory, `${file.name}.${file.size}.complete`).exists
      )
        return null;
      const handle = file.open();
      try {
        return validMp3Header(handle.readBytesSync(4096)) ? file.uri : null;
      } finally {
        handle.close();
      }
    } catch {
      return null;
    }
  }
  return {
    async listSurah(surah) {
      const raw: unknown = await readBundledJson(loadAudioCatalogAsset(surah));
      if (!Array.isArray(raw)) throw new TypeError('Invalid bundled audio catalog');
      return parseAudioCatalog(surah, raw as RawAudioOption[]);
    },
    async getAyahTimings(surah, readId, expectedAyahs) {
      if (
        !Number.isInteger(surah) ||
        surah < 1 ||
        surah > 114 ||
        !Number.isInteger(readId) ||
        readId < 1
      )
        throw new RangeError('Invalid surah or MP3Quran timing read id');
      let cached: File | undefined;
      try {
        cached = new File(Paths.document, 'audio', 'timings', `${readId}-${surah}.json`);
        if (cached.exists)
          return validateAyahTimings(
            JSON.parse(await cached.text()) as AyahTiming[],
            expectedAyahs,
          );
      } catch {
        /* A corrupt/missing local cache is replaced by validated provider data. */
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const response = await fetch(
          `https://www.mp3quran.net/api/v3/ayat_timing?surah=${surah}&read=${readId}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Ayah timings unavailable (${response.status})`);
        const raw = (await response.json()) as Array<{
          ayah: number;
          start_time: number;
          end_time: number;
        }>;
        const rows = validateAyahTimings(
          raw
            .filter((row) => row.ayah > 0)
            .map((row) => ({
              ayah: row.ayah,
              start: row.start_time / 1000,
              end: row.end_time / 1000,
            })),
          expectedAyahs,
        );
        try {
          if (cached) {
            cached.parentDirectory.create({ intermediates: true, idempotent: true });
            await cached.write(JSON.stringify(rows));
          }
        } catch {
          /* Streaming remains available if the device cannot save timing metadata. */
        }
        return rows;
      } finally {
        clearTimeout(timeout);
      }
    },
    resolve(track) {
      return mirroredAudioUrl(audioBaseUrl, track);
    },
    getDownloadedUri(track) {
      try {
        return complete(localFile(track));
      } catch {
        return null;
      }
    },
    async download(track: AudioTrack) {
      const file = localFile(track);
      const active = downloads.get(file.uri);
      if (active) return active;
      const temp = new File(file.parentDirectory, `${file.name}.download`);
      const tempUri = temp.uri;
      const cleanup = async () => {
        // Expo mutates a File's URI after move(). Never delete the moved recording.
        const pending = new File(tempUri);
        if (pending.exists) pending.delete();
      };
      const job = downloadAudio([mirroredAudioUrl(audioBaseUrl, track), track.sourceUrl], {
        complete: () => complete(file),
        async download(url) {
          file.parentDirectory.create({ intermediates: true, idempotent: true });
          await cleanup();
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 300_000);
          try {
            await File.downloadFileAsync(url, temp, { signal: controller.signal });
          } finally {
            clearTimeout(timer);
          }
        },
        async validate() {
          if (!temp.exists || temp.size <= 128) return false;
          const handle = temp.open();
          try {
            return validMp3Header(await handle.readBytes(4096));
          } finally {
            handle.close();
          }
        },
        async commit() {
          if (file.exists) file.delete();
          await new File(tempUri).move(file);
          new File(file.parentDirectory, `${file.name}.${file.size}.complete`).create({
            overwrite: true,
          });
          return file.uri;
        },
        cleanup,
      });
      downloads.set(file.uri, job);
      try {
        return await job;
      } finally {
        if (downloads.get(file.uri) === job) downloads.delete(file.uri);
      }
    },
  };
}
