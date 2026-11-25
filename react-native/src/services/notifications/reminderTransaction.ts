export type ReminderTransaction = {
  existingIds(): Promise<string[]>;
  create(): Promise<string>;
  cancel(id: string): Promise<void>;
};

/** Create first: a failed replacement must never erase a working reminder. */
export async function replaceReminder(
  port: ReminderTransaction,
): Promise<{ identifier: string; cleanupFailures: number }> {
  const previous = await port.existingIds();
  const identifier = await port.create();
  const cleanup = await Promise.allSettled(
    previous.filter((id) => id !== identifier).map((id) => port.cancel(id)),
  );
  return {
    identifier,
    cleanupFailures: cleanup.filter((result) => result.status === 'rejected').length,
  };
}
