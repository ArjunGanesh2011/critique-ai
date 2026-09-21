import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useStore } from '../../lib/store';

const tabIcon = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
);

export default function TabsLayout() {
  const profileComplete = useStore((s) => s.profileComplete);
  // Bounce to onboarding the first time the app loads without a profile.
  if (!profileComplete) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#11161f',
          borderTopColor: '#1f2937',
          height: 76,
          paddingBottom: 16,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#7cf0a1',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'You',     tabBarIcon: tabIcon('🛡️') }} />
      <Tabs.Screen name="macros"   options={{ title: 'Macros',  tabBarIcon: tabIcon('🍱') }} />
      <Tabs.Screen name="camera"   options={{ title: 'Snap',    tabBarIcon: tabIcon('📸') }} />
      <Tabs.Screen name="workouts" options={{ title: 'Gym',     tabBarIcon: tabIcon('🏋️') }} />
      <Tabs.Screen name="diet"     options={{ title: 'Diet',    tabBarIcon: tabIcon('🥗') }} />
      <Tabs.Screen name="quests"   options={{ title: 'Quests',  tabBarIcon: tabIcon('⚔️') }} />
      <Tabs.Screen name="unlock"   options={{ title: 'Unlock',  tabBarIcon: tabIcon('🔓') }} />
    </Tabs>
  );
}
