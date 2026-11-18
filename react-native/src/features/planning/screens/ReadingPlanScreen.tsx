import { readingUnitLabelKey } from '../../../domain/readingUnit';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { addDays } from '../../../domain/journey';
import {
  correctReadingPlan,
  normalizePlanNumber,
  readingPlanDone,
  readingPlanLogged,
  readingPlanPace,
  readingPlanUnits,
  saveReadingPlan,
  type ReadingPlanUnit,
} from '../../../domain/readingPlan';
import { useI18n } from '../../../i18n';
import {
  Button,
  Field,
  Notice,
  Screen,
  Section,
  Segments,
  Sheet,
  T,
  s,
} from '../../../shared/components';
import { Calendar } from '../../../shared/components/Calendar';
import { localDate } from '../../../domain/localDate';

import { useAppStore } from '../../../state/store';
import { useReadingPlan } from '../hooks/useReadingPlan';
import { ReadingPlanHomeCard } from '../components/ReadingPlanHomeCard';

const key = (source: string) => `readingPlan.${source}`;
const purpose =
  'Kies hoeveel je wilt lezen. Welke gedeelten je leest bepaal je zelf; herhaling telt mee. Dit plan staat los van je dagelijkse doelen.';
const counting =
  'Leesregistraties vanaf het starten van dit plan tellen automatisch mee. Ook dezelfde hizb opnieuw lezen telt. Minuten tellen niet mee. Verschillende eenheden worden bij benadering omgerekend (60 hizb = 240 rubʿ = 30 juz = 604 pagina’s = 6236 ayat). Een correctie verandert alleen dit plan, niet je leesgeschiedenis of dagdoel.';
const correctionHelp =
  'Vul je nieuwe totale voortgang in, inclusief wat al automatisch is geteld. Zo telt dezelfde lezing niet dubbel.';

export function ReadingPlanScreen() {
  const { state } = useAppStore();
  const { t, locale } = useI18n();
  const { plan, ready, error, save, retry } = useReadingPlan();
  const [target, setTarget] = useState(String(plan.target));
  const [unit, setUnit] = useState<ReadingPlanUnit>(plan.unit);
  const [end, setEnd] = useState(plan.end);
  const [choosingDate, setChoosingDate] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [correction, setCorrection] = useState('');
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setTarget(String(plan.target));
    setUnit(plan.unit);
    setEnd(plan.end);
  }, [plan]);
  const valid = /^\d+$/.test(target) && Number(target) >= 1 && Number(target) <= 100000;
  const done = readingPlanDone(plan, state.history);
  const logged = readingPlanLogged(plan, state.history);
  const quantity = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 });
  const today = localDate();
  const pace =
    valid && end ? readingPlanPace(plan, state.history, Number(target), unit, end, today) : null;
  const validCorrection =
    normalizePlanNumber(correction).trim() !== '' &&
    Number.isFinite(Number(normalizePlanNumber(correction))) &&
    Number(normalizePlanNumber(correction)) >= 0 &&
    Number(normalizePlanNumber(correction)) <= 1000000;
  async function persist(correct = false) {
    setSaving(true);
    setNotice('');
    setFailed(false);
    try {
      const next = correct
        ? correctReadingPlan(plan, state.history, Number(normalizePlanNumber(correction)))
        : saveReadingPlan(plan, Number(target), unit, end, Date.now());
      await save(next);
      setCorrecting(false);
      setNotice(t(key('Leesplan opgeslagen')));
    } catch {
      setNotice(t(key('Opslaan mislukt. Probeer opnieuw.')));
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <T bold size={30}>
        {t(key('Een leesplan op jouw tempo'))}
      </T>
      <T muted style={{ marginTop: 12 }}>
        {t(key(purpose))}
      </T>
      <ReadingPlanHomeCard onOpen={() => undefined} />
      {error && (
        <Notice error message={t(key('Opslaan mislukt. Probeer opnieuw.'))} onRetry={retry} />
      )}
      {plan.started > 0 && (
        <View style={{ gap: 10, marginTop: 20 }}>
          <T bold>
            {t(key('remaining'))}: {quantity(Math.max(0, plan.target - done))}{' '}
            {t(readingUnitLabelKey(plan.unit))}
          </T>
          <T muted size={13}>
            {t(key('automatic'))}: {quantity(logged)} · {t(key('adjustment'))}:{' '}
            {quantity(plan.adjustment)}
          </T>
          <Button
            title={key('Voortgang aanpassen')}
            variant="secondary"
            onPress={() => {
              setCorrection(String(done));
              setCorrecting(true);
            }}
          />
        </View>
      )}
      <Section title={key('Je doel')} />
      <Field
        label={key('Totaal te lezen')}
        value={target}
        onChangeText={(value) =>
          setTarget(normalizePlanNumber(value).replace(/\D/g, '').slice(0, 6))
        }
        keyboardType="number-pad"
      />
      <Segments
        value={unit}
        onChange={setUnit}
        options={readingPlanUnits.map((value) => ({ value, label: t(readingUnitLabelKey(value)) }))}
      />
      <Section title={key('Planning')} />
      <T muted>{t(key('Een einddatum is optioneel. Zonder datum lees je op je eigen tempo.'))}</T>
      <Button
        testID="reading_plan_end_date"
        title={
          end
            ? new Date(`${end}T12:00:00`).toLocaleDateString(locale, { dateStyle: 'medium' })
            : key('Einddatum kiezen')
        }
        variant="secondary"
        style={{ marginTop: 16 }}
        onPress={() => setChoosingDate(true)}
      />
      {end && (
        <>
          <Button title={key('Zonder einddatum')} variant="quiet" onPress={() => setEnd('')} />
          {pace !== null ? (
            <T>
              {t(key('pace'))}: {quantity(pace)} {t(readingUnitLabelKey(unit))}
            </T>
          ) : (
            <T>
              {t(
                key(
                  'Deze einddatum is verstreken. Kies een nieuwe datum of lees zonder einddatum.',
                ),
              )}
            </T>
          )}
        </>
      )}
      <Button
        title={key(plan.started ? 'Wijzigingen opslaan' : 'Leesplan starten')}
        loading={saving}
        disabled={!ready || !valid}
        onPress={() => void persist()}
        style={{ marginTop: 22 }}
      />
      {notice && <Notice message={notice} error={failed} />}
      <Section title={key('Hoe wordt er geteld?')} />
      <T muted size={14}>
        {t(key(counting))}
      </T>
      <Sheet
        visible={choosingDate}
        title={key('Einddatum kiezen')}
        onClose={() => setChoosingDate(false)}
      >
        <Calendar
          value={end || addDays(today, 14)}
          onChange={(value) => {
            if (value >= today) {
              setEnd(value);
              setChoosingDate(false);
            }
          }}
        />
      </Sheet>
      <Sheet
        visible={correcting}
        title={key('Gelezen totaal corrigeren')}
        onClose={() => setCorrecting(false)}
      >
        <T muted style={{ marginBottom: 16 }}>
          {t(key(correctionHelp))}
        </T>
        <Field
          label={t(readingUnitLabelKey(plan.unit))}
          keyboardType="decimal-pad"
          value={correction}
          onChangeText={setCorrection}
        />
        <View style={[s.row, { gap: 12 }]}>
          <Button
            title={key('Opslaan')}
            disabled={!validCorrection || !ready}
            loading={saving}
            onPress={() => void persist(true)}
          />
          <Button title={key('Annuleren')} variant="quiet" onPress={() => setCorrecting(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}
