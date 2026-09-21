import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useStore, tierFromXp } from '../../lib/store';
import { QUESTS } from '../../lib/quests';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function scheduleHourlyNudge() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;
  // SDK 54 requires the `type` field on the trigger object.
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚔️ Quest time',
      body: 'Hourly check-in. 20 pushups → +25 XP. Tap to log.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3600,
      repeats: true,
    },
  });
  return true;
}

export default function Quests() {
  const xp = useStore((s) => s.xp);
  const completeQuest = useStore((s) => s.completeQuest);
  const questCount = useStore((s) => s.questCount);
  const totalQuestsToday = useStore((s) => s.totalQuestsToday);
  // Subscribe to the underlying state so the UI refreshes when counts change.
  const completedQuestsToday = useStore((s) => s.completedQuestsToday);
  const [nudgesOn, setNudgesOn] = useState(false);

  useEffect(() => {
    Notifications.getAllScheduledNotificationsAsync().then((arr) => setNudgesOn(arr.length > 0));
  }, []);

  const tier = tierFromXp(xp);

  const onComplete = (q) => {
    const currentCount = questCount(q.id);
    if (!q.repeatable && currentCount >= 1) {
      return Alert.alert('Already done today', 'Daily-only quest. Resets tomorrow.');
    }
    const ok = completeQuest(q.id, q.xp, q.repeatable);
    if (ok) {
      const after = tierFromXp(xp + q.xp);
      if (after.current.level > tier.current.level) {
        Alert.alert('LEVEL UP! 🎉', `You're now ${after.current.title}.`);
      }
    }
  };

  const onToggleNudges = async () => {
    if (nudgesOn) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNudgesOn(false);
    } else {
      if (Platform.OS === 'web') {
        return Alert.alert('Notifications', 'Notifications need a real device. Use Expo Go on your phone.');
      }
      try {
        const ok = await scheduleHourlyNudge();
        if (ok) setNudgesOn(true);
        else Alert.alert('Permission denied', 'Enable notifications in iOS settings.');
      } catch (e) {
        Alert.alert('Notification error', String(e?.message || e));
      }
    }
  };

  // Sort: repeatables first, then daily-once
  const sortedQuests = [...QUESTS].sort((a, b) => Number(b.repeatable) - Number(a.repeatable));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Quests</Text>
            <Text style={styles.sub}>{totalQuestsToday()} completions today</Text>
          </View>
          <Pressable onPress={onToggleNudges} style={[styles.nudgeBtn, nudgesOn && styles.nudgeBtnOn]}>
            <Text style={[styles.nudgeText, nudgesOn && styles.nudgeTextOn]}>
              {nudgesOn ? '🔔 Hourly: ON' : '🔕 Hourly: OFF'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>REPEATABLE</Text>
        {sortedQuests.filter((q) => q.repeatable).map((q) => {
          const count = questCount(q.id);
          return (
            <Pressable key={q.id} onPress={() => onComplete(q)} style={styles.questCard}>
              <Text style={styles.questIcon}>{q.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.questTitle}>{q.title}</Text>
                <Text style={styles.questDetail}>{q.detail}</Text>
              </View>
              {count > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>×{count}</Text>
                </View>
              )}
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+{q.xp}</Text>
                <Text style={styles.xpBadgeLabel}>XP</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>DAILY ONLY</Text>
        {sortedQuests.filter((q) => !q.repeatable).map((q) => {
          const done = questCount(q.id) >= 1;
          return (
            <Pressable
              key={q.id}
              onPress={() => onComplete(q)}
              style={[styles.questCard, done && styles.questDone]}
            >
              <Text style={styles.questIcon}>{q.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.questTitle, done && styles.strike]}>{q.title}</Text>
                <Text style={styles.questDetail}>{q.detail}</Text>
              </View>
              <View style={styles.xpBadge}>
                <Text style={styles.xpBadgeText}>+{q.xp}</Text>
                <Text style={styles.xpBadgeLabel}>XP</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 13 },
  sectionLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 4, marginBottom: 4 },
  nudgeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#1f2937',
    borderRadius: 10,
  },
  nudgeBtnOn: { backgroundColor: '#7cf0a1' },
  nudgeText: { color: '#d1d5db', fontWeight: '700', fontSize: 12 },
  nudgeTextOn: { color: '#0b0f17' },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#11161f',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  questDone: { opacity: 0.45, borderColor: '#7cf0a1' },
  questIcon: { fontSize: 30 },
  questTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  questDetail: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  strike: { textDecorationLine: 'line-through' },
  countBadge: {
    backgroundColor: '#7cf0a1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: { color: '#0b0f17', fontWeight: '800', fontSize: 13 },
  xpBadge: {
    backgroundColor: '#0b0f17',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7cf0a1',
    alignItems: 'center',
  },
  xpBadgeText: { color: '#7cf0a1', fontWeight: '800', fontSize: 14 },
  xpBadgeLabel: { color: '#7cf0a1', fontSize: 9, fontWeight: '700' },
});
