import type { DownloadEdition } from './library';

export type BackgroundMushafTask = {
  id: string;
  edition: DownloadEdition;
  status: 'checking' | 'downloading' | 'completed' | 'cancelled' | 'failed';
  completed: number;
  total: number | null;
  unit: 'pages' | 'bytes';
  waiting: boolean;
  error?: string;
};
/** Persistent native ownership. No URL, destination or arbitrary filesystem API is exposed. */
export type BackgroundMushafPort = {
  inspect(): Promise<BackgroundMushafTask | null>;
  start(edition: DownloadEdition): Promise<BackgroundMushafTask>;
  cancel(taskId: string): Promise<BackgroundMushafTask | null>;
  onResume?(listener: () => void): () => void;
};
