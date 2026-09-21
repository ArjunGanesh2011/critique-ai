import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import OnboardingWelcome from '@/screens/onboarding/OnboardingWelcome';
import OnboardingQuiz from '@/screens/onboarding/OnboardingQuiz';
import OnboardingPlan from '@/screens/onboarding/OnboardingPlan';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.accent,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Welcome" component={OnboardingWelcome} options={{ headerShown: false }} />
      <Stack.Screen name="Quiz" component={OnboardingQuiz} options={{ title: 'Profile You', headerBackTitle: ' ' }} />
      <Stack.Screen name="Plan" component={OnboardingPlan} options={{ title: 'Your Plan', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}
