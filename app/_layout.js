import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';

// Close out yesterday the moment it is over: when the app opens, when it
// comes back to the foreground, and once a minute so midnight is caught
// while the app sits open.
function useDayRollover() {
  useEffect(() => {
    const roll = () => useStore.getState()._rollIfNewDay();
    roll();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') roll(); });
    const timer = setInterval(roll, 60 * 1000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
}

export default function RootLayout() {
  useDayRollover();
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0b0f17' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="workout-runner" />
        <Stack.Screen name="growth" />
        <Stack.Screen name="insights" />
      </Stack>
    </SafeAreaProvider>
  );
}
