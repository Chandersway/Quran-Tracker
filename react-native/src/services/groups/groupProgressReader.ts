import type { GroupProgressEntry } from './groupTypes';

type ProgressRecord = GroupProgressEntry & { id: string };
type ReadResult = {
  data: ProgressRecord[] | null;
  error: { message: string; details?: string } | null;
};
export type GroupProgressQuery = PromiseLike<ReadResult> & {
  eq(column: string, value: string): GroupProgressQuery;
  order(column: string, options: { ascending: boolean }): GroupProgressQuery;
  gt(column: string, value: string): GroupProgressQuery;
  limit(size: number): GroupProgressQuery;
};
export type GroupProgressClient = {
  // Keep the SDK's recursive generic query type at this adapter boundary.
  from(table: 'group_progress_entries'): unknown;
};

const PAGE_SIZE = 500;
const validId = (value: string) => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);

/** Primary-key pagination avoids server row caps and unstable offsets. The group/RLS scope is unchanged. */
export async function readGroupProgressEntries(
  client: GroupProgressClient,
  groupId: string,
): Promise<GroupProgressEntry[]> {
  const entries: GroupProgressEntry[] = [];
  let after: string | null = null;
  for (;;) {
    const table = client.from('group_progress_entries') as {
      select(columns: '*'): GroupProgressQuery;
    };
    let query = table
      .select('*')
      .eq('group_id', groupId)
      .order('id', { ascending: true })
      .limit(PAGE_SIZE);
    if (after !== null) query = query.gt('id', after);
    const { data, error } = await query;
    if (error) throw new Error([error.message, error.details].filter(Boolean).join('\n'));
    if (!Array.isArray(data)) throw new Error('Group progress returned no data');
    if (!data.length) return entries;
    for (const row of data) {
      const id = typeof row.id === 'string' ? row.id.toLowerCase() : '';
      if (!validId(id) || (after !== null && id <= after))
        throw new Error('Group progress pagination did not advance');
      after = id;
      entries.push(row);
    }
    // A nonempty short page may be a lower server cap. Only an empty page proves exhaustion.
  }
}
