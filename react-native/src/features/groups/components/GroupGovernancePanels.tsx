import React, { useState } from 'react';
import { View } from 'react-native';
import type { Backend } from '../../../services/backend/backend';
import type { Group } from '../../../services/backend/types';
import type { GroupAuditEntry, GroupReport, GroupRule } from '../../../services/groups/groupTypes';
import { useI18n } from '../../../i18n';
import { Button, Card, Field, Segments, T } from '../../../shared/components';
import { permitted, ResourceState, useGroupResource } from './groupUi';

export function GroupRulesPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, format, locale } = useI18n();
  const [content, setContent] = useState('');
  const resource = useGroupResource(
    async () => {
      const rule = await backend.groups.getRules(group.code);
      setContent(rule?.content ?? '');
      return rule ? [rule] : [];
    },
    [backend, group.code],
    [] as GroupRule[],
  );
  return (
    <View style={{ gap: 14 }}>
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {permitted(group, 'rules.update') ? (
        <Card style={{ gap: 12 }}>
          <Field
            label={t('ui.groups.rules')}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            maxLength={10000}
          />
          <Button
            title={t('ui.groups.publishRules')}
            disabled={resource.busy || !content.trim()}
            loading={resource.busy}
            onPress={() =>
              void resource.run(() => backend.groups.publishRules(group.code, content))
            }
          />
        </Card>
      ) : null}
      {resource.value.map((rule) => (
        <Card key={rule.id} style={{ gap: 8 }}>
          <T bold>{format('ui.groups.ruleVersion', rule.version)}</T>
          <T size={13} muted>
            {new Date(rule.updated_at).toLocaleString(locale)}
          </T>
          <T translate={false} selectable>
            {rule.content}
          </T>
        </Card>
      ))}
    </View>
  );
}

export function GroupReportsPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState('open');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const resource = useGroupResource(
    () => backend.groups.listReports(group.code, status),
    [backend, group.code, status],
    [] as GroupReport[],
  );
  const statuses = ['open', 'reviewing', 'resolved', 'dismissed'];
  const statusLabel = (value: string) =>
    t(`ui.groups.report${value.charAt(0).toUpperCase()}${value.slice(1)}`);
  return (
    <View style={{ gap: 14 }}>
      <Segments
        value={status}
        options={statuses.map((value) => ({ value, label: statusLabel(value) }))}
        onChange={setStatus}
      />
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {resource.value.map((report) => (
        <Card key={report.id} style={{ gap: 10 }}>
          <T bold>{t(`groups.feed.report.reason.${report.reason}`)}</T>
          <T translate={false}>{report.details}</T>
          <T muted>
            {report.reporter_name} · {new Date(report.created_at).toLocaleString(locale)}
          </T>
          <Field
            label={t('ui.groups.resolutionNote')}
            value={notes[report.id] ?? report.resolution_note ?? ''}
            onChangeText={(note) => setNotes((current) => ({ ...current, [report.id]: note }))}
            multiline
            maxLength={2000}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {statuses
              .filter((value) => value !== 'open' && value !== report.status)
              .map((value) => (
                <Button
                  key={value}
                  title={statusLabel(value)}
                  variant="secondary"
                  disabled={resource.busy}
                  onPress={() =>
                    void resource.run(() =>
                      backend.groups.reviewReport(
                        group.code,
                        report.id,
                        value,
                        notes[report.id] ?? report.resolution_note ?? undefined,
                      ),
                    )
                  }
                />
              ))}
          </View>
        </Card>
      ))}
      {resource.value.length >= 30 ? (
        <Button
          title={t('groups.feed.readMore')}
          variant="quiet"
          disabled={resource.busy}
          onPress={() =>
            void resource.run(
              async () => {
                const last = resource.value.at(-1)!;
                const next = await backend.groups.listReports(group.code, status, {
                  createdAt: last.created_at,
                  id: last.id,
                });
                resource.setValue((rows) => [
                  ...rows,
                  ...next.filter((row) => !rows.some((old) => old.id === row.id)),
                ]);
              },
              'groups.error.network',
              false,
            )
          }
        />
      ) : null}
    </View>
  );
}

export function GroupAuditPanel({ backend, group }: { backend: Backend; group: Group }) {
  const { t, locale } = useI18n();
  const resource = useGroupResource(
    () => backend.groups.listAudit(group.code),
    [backend, group.code],
    [] as GroupAuditEntry[],
  );
  return (
    <View style={{ gap: 14 }}>
      <ResourceState {...resource} onRetry={() => void resource.reload()} />
      {resource.value.map((entry) => (
        <Card key={entry.id} style={{ gap: 8 }}>
          <T translate={false} bold>
            {entry.actor_name || t('groups.detail.role.admin')}
          </T>
          <T translate={false}>{entry.action}</T>
          <T size={12} muted>
            {new Date(entry.created_at).toLocaleString(locale)}
          </T>
          {Object.entries(entry.metadata ?? {}).map(([key, value]) => (
            <T key={key} size={13} muted>
              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </T>
          ))}
        </Card>
      ))}
      {resource.value.length >= 30 ? (
        <Button
          title={t('groups.feed.readMore')}
          variant="quiet"
          disabled={resource.busy}
          onPress={() =>
            void resource.run(
              async () => {
                const next = await backend.groups.listAudit(group.code, resource.value.at(-1)!.id);
                resource.setValue((rows) => [
                  ...rows,
                  ...next.filter((row) => !rows.some((old) => old.id === row.id)),
                ]);
              },
              'groups.error.network',
              false,
            )
          }
        />
      ) : null}
    </View>
  );
}
