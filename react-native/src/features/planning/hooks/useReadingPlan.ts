import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createReadingPlanRepository } from '../../../services/planning/independentReadingPlan';
import { useAppStore } from '../../../state/store';

const repository = createReadingPlanRepository(AsyncStorage);

export function useReadingPlan() {
  const { state } = useAppStore();
  const legacy = state.legacyAndroid?.independentReadingPlan;
  const snapshot = useSyncExternalStore(
    repository.subscribe,
    repository.snapshot,
    repository.snapshot,
  );
  useEffect(() => {
    void repository.load(legacy);
  }, [legacy]);
  return {
    ...snapshot,
    save: repository.save,
    retry: () => {
      void repository.load(legacy, true);
    },
  };
}
