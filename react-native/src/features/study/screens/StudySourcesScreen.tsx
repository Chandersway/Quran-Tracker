import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStack } from '../../../app/navigation/types';
import { StudySourceContent } from './StudySourceContent';

/** Route changes remount the editor before displaying any previous result. */
export function StudySourcesScreen({ route }: NativeStackScreenProps<RootStack, 'StudySources'>) {
  return <StudySourceContent key={JSON.stringify(route.params)} params={route.params} />;
}
