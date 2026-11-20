import 'react-native-url-polyfill/auto';
import React from 'react';
import { AppNavigator } from './src/app/navigation/AppNavigator';
import { AppProviders } from './src/app/providers/AppProviders';

export default function App() {
  return (
    <AppProviders>
      <AppNavigator />
    </AppProviders>
  );
}
