import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';

import { colors } from '@/theme/colors';
import { useGameStore } from '@/store/gameStore';
import RootNavigator from '@/navigation/RootNavigator';
import OnboardingNavigator from '@/navigation/OnboardingNavigator';

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    primary: colors.accent,
    border: colors.border,
    notification: colors.accent,
  },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const onboarded = useGameStore(s => s.onboarded);
  const hydrate = useGameStore(s => s.hydrate);

  useEffect(() => {
    hydrate().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={navTheme}>
          {onboarded ? <RootNavigator /> : <OnboardingNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
