import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readGroupProgressEntries,
  type GroupProgressClient,
} from '../src/services/groups/groupProgressReader';
import { createGroupOperations } from '../src/services/groups/groupOperations';
import { groupDashboard, groupGoalProgress } from '../src/services/groups/groupMetrics';
import type { GroupOperationPort, GroupProgressEntry } from '../src/services/groups/groupTypes';

const id = (number: number) => `00000000-0000-4000-8000-${number.toString(16).padStart(12, '0')}`;
type Row = GroupProgressEntry & { id: string; group_id: string };
const rows: Row[] = Array.from({ length: 1501 }, (_, index) => ({
  id: id(index + 1),
  group_id: 'target-group',
  user_id: 'reader',
  unit: 'page',
  amount: 1,
  source: 'manual',
  occurred_on: index < 1300 ? '2026-10-01' : '2026-11-17',
}));

function clientFixture(serverCap = 1000, failPage = -1, ignoreCursor = false) {
  const reads: Array<{ group: string; cursor: string | null; limit: number; order: string }> = [];
  const all = [
    ...rows.slice().reverse(),
    ...rows.slice(0, 30).map((row) => ({ ...row, group_id: 'other-group' })),
  ];
  const client: GroupProgressClient = {
    from(table) {
      assert.equal(table, 'group_progress_entries');
      let group = '',
        cursor: string | null = null,
        limit = 0,
        order = '';
      const query = {
        select(columns: string) {
          assert.equal(columns, '*');
          return query;
        },
        eq(column: string, value: string) {
          assert.equal(column, 'group_id');
          group = value;
          return query;
        },
        order(column: string, options: { ascending: boolean }) {
          assert.equal(options.ascending, true);
          order = column;
          return query;
        },
        gt(column: string, value: string) {
          assert.equal(column, 'id');
          cursor = value;
          return query;
        },
        limit(size: number) {
          limit = size;
          assert.ok(size > 0 && size <= 500);
          return query;
        },
        then(resolve: (value: unknown) => unknown) {
          assert.equal(order, 'id');
          reads.push({ group, cursor, limit, order });
          const data = all
            .filter(
              (row) =>
                row.group_id === group && (ignoreCursor || cursor === null || row.id > cursor),
            )
            .sort((a, b) => a.id.localeCompare(b.id))
            .slice(0, Math.min(limit, serverCap));
          return Promise.resolve(
            reads.length === failPage
              ? { data: null, error: { message: 'read denied', details: 'permission changed' } }
              : { data, error: null },
          ).then(resolve);
        },
      };
      return query;
    },
  };
  return { client, reads };
}

function service(client: GroupProgressClient) {
  return createGroupOperations({
    group: async () => ({ id: 'target-group', code: 'QUR-1234' }),
    members: async () => [],
    rpc: async <T>() => [] as T,
    select: async <T>(table: string, groupId: string) => {
      assert.equal(table, 'group_progress_entries');
      return (await readGroupProgressEntries(client, groupId)) as T[];
    },
  } as unknown as GroupOperationPort);
}

test('real adapter and leaderboard service include more than 1000 readings and later dates without crossing group scope', async () => {
  const f = clientFixture();
  const leaderboard = await service(f.client).listLeaderboard('QUR-1234');
  const dashboard = groupDashboard(leaderboard);
  assert.equal(dashboard.readings, 1501);
  assert.equal(dashboard.totalAyahs, 15010);
  assert.equal(dashboard.pages, 1501);
  assert.equal(dashboard.recent[0]?.entry.occurred_on, '2026-11-17');
  const now = new Date('2026-11-17T12:00:00Z');
  assert.equal(
    groupGoalProgress(
      leaderboard,
      { progress_unit: 'page', goal_period: 'total', goal_target: 2000 },
      now,
    ).achieved,
    1501,
  );
  assert.equal(
    groupGoalProgress(
      leaderboard,
      { progress_unit: 'page', goal_period: 'daily', goal_target: 300 },
      now,
    ).achieved,
    201,
  );
  assert.equal(
    groupGoalProgress(
      leaderboard,
      { progress_unit: 'page', goal_period: 'weekly', goal_target: 300 },
      now,
    ).achieved,
    201,
  );
  assert.deepEqual(
    f.reads.map((read) => read.cursor),
    [null, id(500), id(1000), id(1500), id(1501)],
  );
  assert.ok(f.reads.every((read) => read.group === 'target-group'));
});

test('a server cap lower than the requested batch does not silently truncate a nonempty short page', async () => {
  const f = clientFixture(125);
  const entries = await readGroupProgressEntries(f.client, 'target-group');
  assert.equal(entries.length, 1501);
  assert.equal(f.reads.length, 14);
  assert.equal(f.reads.at(-1)?.cursor, id(1501));
});

test('later page failures propagate through the real service instead of publishing partial aggregate totals', async () => {
  const f = clientFixture(1000, 2);
  await assert.rejects(
    () => service(f.client).listLeaderboard('QUR-1234'),
    /read denied\npermission changed/,
  );
  assert.equal(f.reads.length, 2);
});

test('a nonadvancing page rejects instead of duplicating rows or looping forever', async () => {
  const f = clientFixture(1000, -1, true);
  await assert.rejects(
    () => readGroupProgressEntries(f.client, 'target-group'),
    /pagination did not advance/,
  );
  assert.equal(f.reads.length, 2);
});
