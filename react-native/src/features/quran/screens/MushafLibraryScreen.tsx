import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Alert, Platform, View } from 'react-native';
import { useAppStore } from '../../../state/store';
import { useI18n } from '../../../i18n';
import { Button, Card, Notice, Screen, T } from '../../../shared/components';
import { usePalette } from '../../../shared/theme';
import { useAppNavigation, type RootStack } from '../../../app/navigation/types';
import {
  mushafOptions,
  optionFor,
  type DownloadEdition,
  type LibraryEdition,
} from '../../../services/mushaf/library';
import { removeMushaf } from '../../../services/mushaf/storage';
import { mushafDownloads } from '../../../services/mushaf/mushafDownloads';
import { downloadCopy, remainingDownloadTime } from '../model/mushafDownloadCopy';
import { resolveBookEntry } from '../../../domain/bookPresentation';

// New functional controls; edition descriptions remain the exact source literals.
const copy = {
  en: {
    title: 'Mushaf library',
    download: 'Download',
    select: 'Select',
    selected: 'Selected',
    bundled: 'Included',
    local: 'Local package',
    ready: 'Downloaded',
    missing: 'Not downloaded',
    checking: 'Checking downloads…',
    partial: 'Downloaded pages',
    cancel: 'Cancel download',
    remove: 'Remove download',
    confirm: 'Download this Mushaf?',
    size: 'Page packages can require about 60–70 MB. PDF sizes vary.',
    removeTitle: 'Remove this download?',
    removeBody: 'The downloaded files for this edition will be removed from this device.',
    failed: 'Download could not be completed. Check your connection and storage, then retry.',
    web: 'Downloads are available in the mobile app.',
    working: 'Downloading',
  },
  nl: {
    title: 'Mushaf-bibliotheek',
    download: 'Downloaden',
    select: 'Kiezen',
    selected: 'Gekozen',
    bundled: 'Inbegrepen',
    local: 'Lokaal pakket',
    ready: 'Gedownload',
    missing: 'Niet gedownload',
    checking: 'Downloads controleren…',
    partial: 'Gedownloade pagina’s',
    cancel: 'Download annuleren',
    remove: 'Download verwijderen',
    confirm: 'Wil je deze mushaf downloaden?',
    size: 'Paginapakketten vereisen ongeveer 60–70 MB. PDF-formaten verschillen.',
    removeTitle: 'Deze download verwijderen?',
    removeBody: 'De bestanden van deze editie worden van dit apparaat verwijderd.',
    failed: 'Downloaden is niet gelukt. Controleer je verbinding en opslag en probeer opnieuw.',
    web: 'Downloads zijn beschikbaar in de mobiele app.',
    working: 'Downloaden',
  },
  ar: {
    title: 'مكتبة المصاحف',
    download: 'تنزيل',
    select: 'اختيار',
    selected: 'المحدد',
    bundled: 'مضمّن',
    local: 'حزمة محلية',
    ready: 'تم التنزيل',
    missing: 'لم يُنزّل',
    checking: 'جارٍ التحقق من التنزيلات…',
    partial: 'الصفحات المنزلة',
    cancel: 'إلغاء التنزيل',
    remove: 'حذف التنزيل',
    confirm: 'تنزيل هذا المصحف؟',
    size: 'قد تحتاج حزم الصفحات إلى نحو 60–70 ميغابايت. تختلف أحجام ملفات PDF.',
    removeTitle: 'حذف هذا التنزيل؟',
    removeBody: 'ستُحذف ملفات هذه النسخة من هذا الجهاز.',
    failed: 'تعذر التنزيل. تحقق من الاتصال والمساحة ثم حاول مجددًا.',
    web: 'التنزيل متاح في تطبيق الهاتف.',
    working: 'جارٍ التنزيل',
  },
} as const;
// The Dutch descriptions are Kotlin literals; English and Arabic are new translations of those complete descriptions.
const descriptions: Record<LibraryEdition, { en: string; nl: string; ar: string }> = {
  hafs_maknoon: {
    en: 'Individual Hafs pages, sharp and fast',
    nl: "Losse Hafs-pagina's, scherp en snel",
    ar: 'صفحات حفص منفصلة وواضحة وسريعة',
  },
  hafs: {
    en: 'The standard Mushaf included in the app',
    nl: 'Standaard mushaf in de app',
    ar: 'المصحف القياسي المضمّن في التطبيق',
  },
  warsh_maknoon: {
    en: 'Individual Warsh pages with cleaner alignment',
    nl: "Losse Warsh-pagina's, netter uitgelijnd",
    ar: 'صفحات ورش منفصلة بمحاذاة أوضح',
  },
  hafs_madina_pdf: {
    en: 'Complete Hafs Madani Mushaf as a downloadable package',
    nl: 'Complete Hafs Madani mushaf als downloadpakket',
    ar: 'مصحف حفص المدني كاملًا كحزمة قابلة للتنزيل',
  },
  hafs_indopak_15: {
    en: 'Familiar IndoPak layout for memorization and review',
    nl: 'Bekende IndoPak-layout voor hifz en herhaling',
    ar: 'تنسيق هندي باكستاني مألوف للحفظ والمراجعة',
  },
};

export function MushafLibraryScreen() {
  const route = useRoute<RouteProp<RootStack, 'MushafLibrary'>>();
  const { state, dispatch } = useAppStore();
  const { locale, t } = useI18n();
  const p = usePalette();
  const nav = useAppNavigation();
  const text = copy[locale];
  const downloads = useSyncExternalStore(
    mushafDownloads.subscribe,
    mushafDownloads.getSnapshot,
    mushafDownloads.getSnapshot,
  );
  const status = downloads.installed;
  const active = downloads.active;
  const busy = active?.edition ?? null;
  const progress = { done: active?.completed ?? 0, total: active?.total ?? 0 };
  const downloadText = downloadCopy[locale];
  const [error, setError] = useState('');
  useEffect(() => {
    void mushafDownloads.refresh();
  }, []);
  function select(id: LibraryEdition) {
    dispatch({
      type: 'preferences',
      patch: { mushaf: id === 'hafs' ? 'hafs_ayahinfo_1260' : id, bookPresentation: 'original' },
    });
  }
  async function askDownload(id: DownloadEdition) {
    const option = optionFor(id);
    let details: string = text.size;
    if (option.type === 'pdf' && option.url) {
      const abort = new AbortController();
      const timeout = setTimeout(() => abort.abort(), 7000);
      try {
        const response = await fetch(option.url, {
          method: 'HEAD',
          signal: abort.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Wirdna/1.0)' },
        });
        const bytes = Number(response.headers.get('content-length'));
        if (response.ok && bytes > 0) details = `≈ ${(bytes / 1024 / 1024).toFixed(1)} MB`;
      } catch {
        /* Size is optional; confirmation still names uncertainty. */
      } finally {
        clearTimeout(timeout);
      }
    }
    Alert.alert(text.confirm, details, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: text.download,
        onPress: () => {
          setError('');
          mushafDownloads.start(id);
        },
      },
    ]);
  }
  function askRemove(id: DownloadEdition) {
    Alert.alert(text.removeTitle, text.removeBody, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          try {
            if (mushafDownloads.getSnapshot().active) return;
            removeMushaf(id);
            if (state.preferences.mushaf === id) select('hafs');
            void mushafDownloads.refresh();
          } catch {
            setError(text.failed);
          }
        },
      },
    ]);
  }
  return (
    <Screen key={route.params?.focusDownload ?? 'library'} style={{ gap: 14 }}>
      <T translate={false} bold size={30}>
        {text.title}
      </T>
      {Platform.OS === 'web' && <Notice message={text.web} />}
      {error ? <Notice error message={error} /> : null}
      {downloads.error || downloads.lastTask?.status === 'failed' ? (
        <Notice error message={text.failed} />
      ) : null}
      {downloads.error && (
        <Button
          title={downloadText.checkAgain}
          variant="quiet"
          disabled={downloads.checking}
          onPress={() => {
            void mushafDownloads.refresh();
          }}
        />
      )}
      {downloads.lastTask?.status === 'cancelled' ? (
        <Notice message={downloadText.cancelled} />
      ) : null}
      {[...mushafOptions]
        .sort((a, b) => Number(b.id === busy) - Number(a.id === busy))
        .map((option) => {
          const editionSelected =
            option.id === 'hafs'
              ? state.preferences.mushaf === 'hafs_ayahinfo_1260' ||
                state.preferences.mushaf === 'text'
              : state.preferences.mushaf === option.id;
          const selected = editionSelected && state.preferences.bookPresentation === 'original';
          const current = option.id === 'hafs' ? null : status[option.id];
          const ready = option.id === 'hafs' || !!current?.ready;
          return (
            <Card
              key={option.id}
              style={{ borderWidth: 1, borderColor: selected ? p.primary : p.line, gap: 8 }}
            >
              <T translate={false} bold size={19}>
                {option.title}
              </T>
              <T translate={false} muted size={13}>
                {descriptions[option.id][locale]}
              </T>
              <T translate={false} muted size={12}>
                {option.id === 'hafs' ? text.local : option.source} ·{' '}
                {option.id === 'hafs'
                  ? text.bundled
                  : !current
                    ? text.checking
                    : current.ready
                      ? text.ready
                      : option.type === 'pdf'
                        ? text.missing
                        : `${text.partial}: ${current.count}/${current.total}`}
              </T>
              {busy === option.id && (
                <T translate={false} color={p.primary}>
                  {active?.status === 'checking'
                    ? text.checking
                    : active?.status === 'cancelling'
                      ? downloadText.cancelling
                      : text.working}{' '}
                  ·{' '}
                  {option.type === 'pdf'
                    ? active?.fraction == null
                      ? `${(progress.done / 1024 / 1024).toFixed(1)} MB`
                      : `${Math.floor(active.fraction * 100)}%`
                    : `${progress.done}/${progress.total}`}
                </T>
              )}
              {busy === option.id && active && (
                <T translate={false} muted size={12}>
                  {active.stalled
                    ? downloadText.waiting
                    : remainingDownloadTime(locale, active.remainingSeconds)}
                </T>
              )}
              {busy === option.id && active?.unit === 'pages' && (
                <T translate={false} muted size={12}>
                  {downloadText.estimateNote}
                </T>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Button
                  title={`${selected ? text.selected : text.select} · ${t('ui.selectableMushaf.scan')}`}
                  variant={selected ? 'primary' : 'secondary'}
                  disabled={!ready || selected}
                  onPress={() => select(option.id)}
                />
                {ready && (
                  <Button
                    title={`${t('common.open')} · ${t('ui.selectableMushaf.scan')}`}
                    variant="quiet"
                    onPress={() =>
                      nav.push(
                        'Mushaf',
                        resolveBookEntry(
                          state,
                          {
                            surah: state.cursor.surah,
                            ayah: state.cursor.ayah,
                            edition: option.id,
                            page: state.mushafPositions[option.id],
                          },
                          'original',
                        ),
                      )
                    }
                  />
                )}
                {option.id !== 'hafs' &&
                  (busy === option.id ? (
                    <Button
                      title={text.cancel}
                      variant="quiet"
                      disabled={active?.status === 'cancelling'}
                      onPress={() => mushafDownloads.cancel()}
                    />
                  ) : ready ? (
                    <Button
                      title={text.remove}
                      variant="quiet"
                      disabled={!!busy}
                      onPress={() => askRemove(option.id as DownloadEdition)}
                    />
                  ) : (
                    <Button
                      title={
                        downloads.lastTask?.edition === option.id &&
                        downloads.lastTask.status !== 'completed'
                          ? option.type === 'pdf'
                            ? downloadText.retryPdf
                            : downloadText.retry
                          : text.download
                      }
                      disabled={!current || !!busy || Platform.OS === 'web'}
                      onPress={() => {
                        void askDownload(option.id as DownloadEdition);
                      }}
                    />
                  ))}
              </View>
            </Card>
          );
        })}
    </Screen>
  );
}
