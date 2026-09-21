import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

import HomeScreen from '@/screens/HomeScreen';
import NutritionScreen from '@/screens/NutritionScreen';
import FoodSearchScreen from '@/screens/FoodSearchScreen';
import PhotoMacroScreen from '@/screens/PhotoMacroScreen';
import WorkoutScreen from '@/screens/WorkoutScreen';
import WorkoutBuilderScreen from '@/screens/WorkoutBuilderScreen';
import WorkoutSessionScreen from '@/screens/WorkoutSessionScreen';
import OutfitScreen from '@/screens/OutfitScreen';
import PhysiqueScreen from '@/screens/PhysiqueScreen';
import PostureScreen from '@/screens/PostureScreen';
import BreathingScreen from '@/screens/BreathingScreen';
import RankingsScreen from '@/screens/RankingsScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import AIAssistantScreen from '@/screens/AIAssistantScreen';
import AppBlockerScreen from '@/screens/AppBlockerScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 18 }}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="◎" focused={focused} /> }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="◐" focused={focused} /> }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="◈" focused={focused} /> }}
      />
      <Tab.Screen
        name="AI"
        component={AIAssistantScreen}
        options={{ title: 'Coach', tabBarIcon: ({ focused }) => <TabIcon label="◆" focused={focused} /> }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="◇" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerTintColor: colors.accent,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="FoodSearch" component={FoodSearchScreen} options={{ title: 'Search Foods' }} />
      <Stack.Screen name="PhotoMacro" component={PhotoMacroScreen} options={{ title: 'Scan Meal' }} />
      <Stack.Screen name="WorkoutBuilder" component={WorkoutBuilderScreen} options={{ title: 'Build Workout' }} />
      <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} options={{ title: 'Workout' }} />
      <Stack.Screen name="Outfit" component={OutfitScreen} options={{ title: 'Outfit Rating' }} />
      <Stack.Screen name="Physique" component={PhysiqueScreen} options={{ title: 'Physique Scan' }} />
      <Stack.Screen name="Posture" component={PostureScreen} options={{ title: 'Posture Analysis' }} />
      <Stack.Screen name="Breathing" component={BreathingScreen} options={{ title: 'Breathing' }} />
      <Stack.Screen name="Rankings" component={RankingsScreen} options={{ title: 'Rankings' }} />
      <Stack.Screen name="AppBlocker" component={AppBlockerScreen} options={{ title: 'Focus Lock' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
