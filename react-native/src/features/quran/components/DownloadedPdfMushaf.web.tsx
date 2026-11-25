import type { RootStack } from '../../../app/navigation/types';
import React from 'react';
import { Button, Notice, Screen, T } from '../../../shared/components';
import { useI18n } from '../../../i18n';
import { ReadingModeSwitch } from './ReadingModeSwitch';
import type { DownloadEdition } from '../../../services/mushaf/library';
export function DownloadedPdfMushaf({
  onLibrary,
  onText,
  initialPage,
  context,
  onSelectable,
}: {
  id: DownloadEdition;
  surah: number;
  initialPage: number;
  context?: RootStack['Mushaf'];
  onLibrary: () => void;
  onText: (page: number, zoom: number) => void;
  shortLandscape: boolean;
  onBack: () => void;
  onSelectable: (page: number, zoom: number) => void;
}) {
  const { t } = useI18n();
  return (
    <Screen>
      <ReadingModeSwitch
        mode="book"
        onBook={() => {}}
        onText={() => onText(initialPage, context?.bookView?.zoom ?? 1)}
      />
      <T muted>{t('ui.mushaf.pdfTextPosition')}</T>
      <Button
        title={t('ui.selectableMushaf.fromPdf')}
        icon="type"
        variant="secondary"
        onPress={() => onSelectable(initialPage, context?.bookView?.zoom ?? 1)}
      />
      <Notice message="rub.open.download" />
      <Button title="app.mushaf" onPress={onLibrary} />
    </Screen>
  );
}
