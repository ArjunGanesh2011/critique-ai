import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../lib/store';

// "Earn your screen time" — do 10 pushups + 10 squats + 10 situps,
// then the app gives you a green light. Honor system, but it works:
// the friction of opening Critique Fit and tapping through 30 reps
// is enough to break the social-media loop most of the time.

const REQUIREMENTS = {
  pushups: { label: 'Pushups', icon: '💪', target: 10 },
  squats:  { label: 'Squats',  icon: '🦵', target: 10 },
  situps:  { label: 'Situps',  icon: '🦴', target: 10 },
};

const XP_REWARD = 60;
const UNLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes of unlocked time after completing

export default function Unlock() {
  const addXp = useStore((s) => s.addXp);
  const [reps, setReps] = useState({ pushups: 0, squats: 0, situps: 0 });
  const [unlockedUntil, setUnlockedUntil] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Tick every second so the countdown updates
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isUnlocked = unlockedUntil && now < unlockedUntil;
  const remainingMs = unlockedUntil ? Math.max(0, unlockedUntil - now) : 0;
  const remainingMin = Math.floor(remainingMs / 60000);
  const remainingSec = Math.floor((remainingMs % 60000) / 1000);

  const allDone = Object.entries(REQUIREMENTS).every(
    ([k, r]) => reps[k] >= r.target
  );

  const inc = (k) => {
    setReps((prev) => ({ ...prev, [k]: prev[k] + 1 }));
  };

  const decFifth = (k) => {
    // Long-press or "−5" button — useful if you tap too many times
    setReps((prev) => ({ ...prev, [k]: Math.max(0, prev[k] - 5) }));
  };

  const onUnlock = () => {
    if (!allDone) {
      return Alert.alert('Not yet', 'Finish all 3 sets first.');
    }
    addXp(XP_REWARD);
    setUnlockedUntil(Date.now() + UNLOCK_DURATION_MS);
    setReps({ pushups: 0, squats: 0, situps: 0 });
    Alert.alert(
      'Unlocked 🎉',
      `+${XP_REWARD} XP. You have 30 minutes of guilt-free screen time.\n\nIf you set up the iOS Shortcut, your social apps are now allowed.`
    );
  };

  const reset = () => setReps({ pushups: 0, squats: 0, situps: 0 });

  const openShortcutsHelp = () => {
    Alert.alert(
      'iOS Shortcut setup',
      'Apple\'s Screen Time can block apps, but only via the Shortcuts app. Open Shortcuts on your phone → create a new Personal Automation → "Time of Day" → enable App Limits for Instagram, TikTok, etc. Then add a manual override here.\n\nFull guide:',
      [
        { text: 'OK', style: 'cancel' },
        {
          text: 'Open Apple guide',
          onPress: () => Linking.openURL('https://support.apple.com/guide/iphone/use-screen-time-iphbfa595995/ios'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Earn your screen time</Text>
        <Text style={styles.sub}>10 pushups · 10 squats · 10 situps</Text>

        {isUnlocked ? (
          <View style={styles.unlockedCard}>
            <Text style={styles.unlockedTitle}>✅ Unlocked</Text>
            <Text style={styles.unlockedTime}>
              {String(remainingMin).padStart(2, '0')}:{String(remainingSec).padStart(2, '0')}
            </Text>
            <Text style={styles.unlockedSub}>remaining</Text>
            <Pressable onPress={() => setUnlockedUntil(null)} style={[styles.btnGhost, { marginTop: 16 }]}>
              <Text style={styles.btnGhostText}>End early & re-lock</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {Object.entries(REQUIREMENTS).map(([key, r]) => {
              const count = reps[key];
              const done = count >= r.target;
              const pct = Math.min(100, (count / r.target) * 100);
              return (
                <View key={key} style={[styles.exerciseCard, done && styles.exerciseDone]}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exIcon}>{r.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exLabel}>{r.label}</Text>
                      <Text style={styles.exCount}>
                        {count} / {r.target} {done && '✓'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressOuter}>
                    <View
                      style={[
                        styles.progressInner,
                        { width: `${pct}%`, backgroundColor: done ? '#7cf0a1' : '#60a5fa' },
                      ]}
                    />
                  </View>
                  <View style={styles.btnRow}>
                    <Pressable onPress={() => decFifth(key)} style={[styles.repBtn, styles.repBtnMinus]}>
                      <Text style={styles.repBtnText}>−5</Text>
                    </Pressable>
                    <Pressable onPress={() => inc(key)} style={[styles.repBtn, styles.repBtnPlus]}>
                      <Text style={styles.repBtnPlusText}>+1 Rep</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <Pressable
              onPress={onUnlock}
              style={[styles.unlockBtn, !allDone && styles.unlockBtnLocked]}
              disabled={!allDone}
            >
              <Text style={[styles.unlockText, !allDone && styles.unlockTextLocked]}>
                {allDone ? `🔓 Unlock (+${XP_REWARD} XP)` : '🔒 Finish all 3 sets'}
              </Text>
            </Pressable>

            <Pressable onPress={reset} style={styles.resetBtn}>
              <Text style={styles.resetText}>Reset counters</Text>
            </Pressable>
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to actually block apps</Text>
          <Text style={styles.infoBody}>
            iOS doesn't let third-party apps block other apps. This screen is the honor-system gate —
            the friction of doing the reps before opening Instagram works for most people.
            {'\n\n'}
            For real blocking: use iOS <Text style={styles.bold}>Screen Time</Text> →
            <Text style={styles.bold}> App Limits</Text> to set Instagram/TikTok/etc. to 0 minutes/day.
            Then this screen becomes your "request more time" gate. After unlocking, manually open
            Screen Time and tap "Ignore Limit For Today" or "Ignore for 15 Minutes."
          </Text>
          <Pressable onPress={openShortcutsHelp} style={styles.helpBtn}>
            <Text style={styles.helpBtnText}>Show me how →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 14, paddingBottom: 60 },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 14 },
  exerciseCard: {
    backgroundColor: '#11161f',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    gap: 10,
  },
  exerciseDone: { borderColor: '#7cf0a1' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exIcon: { fontSize: 36 },
  exLabel: { color: '#fff', fontSize: 18, fontWeight: '700' },
  exCount: { color: '#9ca3af', fontSize: 14, marginTop: 2 },
  progressOuter: { height: 8, backgroundColor: '#1f2937', borderRadius: 4, overflow: 'hidden' },
  progressInner: { height: '100%', borderRadius: 4 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  repBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  repBtnMinus: { backgroundColor: '#1f2937', flex: 1 },
  repBtnPlus: { backgroundColor: '#7cf0a1', flex: 3 },
  repBtnText: { color: '#d1d5db', fontWeight: '700' },
  repBtnPlusText: { color: '#0b0f17', fontWeight: '800', fontSize: 16 },
  unlockBtn: {
    backgroundColor: '#7cf0a1',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  unlockBtnLocked: { backgroundColor: '#1f2937' },
  unlockText: { color: '#0b0f17', fontSize: 17, fontWeight: '800' },
  unlockTextLocked: { color: '#6b7280' },
  resetBtn: { alignSelf: 'center', padding: 10 },
  resetText: { color: '#6b7280', fontSize: 12 },
  unlockedCard: {
    backgroundColor: '#11161f',
    borderColor: '#7cf0a1',
    borderWidth: 2,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  unlockedTitle: { color: '#7cf0a1', fontSize: 22, fontWeight: '800' },
  unlockedTime: { color: '#fff', fontSize: 56, fontWeight: '800', marginTop: 8 },
  unlockedSub: { color: '#9ca3af', fontSize: 13 },
  btnGhost: { backgroundColor: '#1f2937', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  btnGhostText: { color: '#d1d5db', fontWeight: '600' },
  infoCard: {
    backgroundColor: '#11161f',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  infoTitle: { color: '#fbbf24', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  infoBody: { color: '#9ca3af', fontSize: 13, lineHeight: 19 },
  bold: { color: '#fff', fontWeight: '700' },
  helpBtn: { marginTop: 10 },
  helpBtnText: { color: '#7cf0a1', fontWeight: '700', fontSize: 13 },
});
