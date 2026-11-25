import React, { useState } from 'react';
import { Button, Sheet } from '../../../shared/components';

/** Compact picker for canonical chapters or a provider's published coverage index. */
export function AvailableSourcePicker({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: number;
  options: readonly { value: number; label: string }[];
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        title={`${title}: ${options.find((option) => option.value === value)?.label ?? '—'}`}
        disabled={!options.length}
        variant="secondary"
        icon="chevron-down"
        onPress={() => setOpen(true)}
      />
      <Sheet visible={open} title={title} onClose={() => setOpen(false)}>
        {options.map((option) => (
          <Button
            key={option.value}
            title={option.label}
            variant={option.value === value ? 'primary' : 'quiet'}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}
