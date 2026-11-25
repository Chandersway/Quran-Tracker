import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { GroupsScreen } from '../../features/groups/screens/GroupsScreen';
import { MainScreen } from '../../features/home/screens/MainScreen';
import { PlanningScreen } from '../../features/planning/screens/PlanningScreen';
import { ProgressScreen } from '../../features/practice/screens/ProgressScreen';
import { QuranScreen } from '../../features/quran/screens/QuranScreen';
import { NavigationDock } from './NavigationDock';
const Tab = createBottomTabNavigator();
export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <NavigationDock {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Today" component={MainScreen} />
      <Tab.Screen name="Quran" component={QuranScreen} />
      <Tab.Screen name="Practice" component={HizbScreen} />
      <Tab.Screen name="Juz" component={JuzScreen} />
      <Tab.Screen name="Plan" component={PlanningScreen} />
      <Tab.Screen name="Circle" component={GroupsScreen} />
    </Tab.Navigator>
  );
}
function JuzScreen() {
  return <ProgressScreen initialMode="juz" dedicated />;
}
function HizbScreen() {
  return <ProgressScreen initialMode="hizb" dedicated />;
}
