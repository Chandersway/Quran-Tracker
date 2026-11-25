import React from 'react';
import { FloatingReaderButton } from './FloatingReaderButton';

export function FullscreenExitButton({ label, onExit }: { label: string; onExit: () => void }) {
  return <FloatingReaderButton label={label} onPress={onExit} />;
}
