import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore, tierFromXp } from '../../lib/store';
import CharacterCard from '../../components/CharacterCard';
import MacroBar from '../../components/MacroBar';

export default function Home() {
  const xp = useStore((s) => s.xp);
  const streak = useStore((s) => s.streak);
  const today = useStore((s) => s.today);
  const goals = useStore((s) => s.goals);
  const totalQuestsToday = useStore((s) => s.totalQuestsToday);
  const checkInDaily = useStore((s) => s.checkInDaily);
  const resetAll = useStore((s) => s.resetAll);
  const profile = useStore((s) => s.profile);
  const weights = useStore((s) => s.weights);
  const startWeight = useStore((s) => s.startWeight);
  const currentWeight = useStore((s) => s.currentWeight);
  const logWeight = useStore((s) => s.logWeight);

  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  useEffect(() => { checkInDaily(); }, []);

  const tier = tierFromXp(xp);
  const sw = startWeight();
  const cw = currentWeight();
  const gw = profile.goalWeightKg;
  const swLb = sw ? (sw * 2.2046).toFixed(1) : '—';
  const cwLb = cw ? (cw * 2.2046).toFixed(1) : '—';
  const gwLb = gw ? (gw * 2.2046).toFixed(1) : '—';
  const deltaLb = (sw && cw) ? ((cw - sw) * 2.2046).toFixed(1) : '0.0';
  const deltaSign = parseFloat(deltaLb) >= 0 ? '+' : '';

  // direction of progress: closer to goal = green
  let trendColor = '#9ca3af';
  if (sw && cw && gw) {
    const startToGoal = Math.abs(gw - sw);
    const currentToGoal = Math.abs(gw - cw);
    if (currentToGoal < startToGoal) trendColor = '#7cf0a1';
    else if (currentToGoal > startToGoal) trendColor = '#ef4444';
  }

  const onLogWeight = () => {
    const lb = parseFloat(weightInput);
    if (!lb || lb <= 0) return Alert.alert('Bad weight', 'Enter weight in pounds.');
    const kg = lb / 2.2046;
    // 4 decimal precision so kg → lb conversion is lossless
    logWeight(Math.round(kg * 10000) / 10000);
    setWeightInput('');
    setWeightModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>What's up, {profile.name || 'Arjun'}</Text>
        <Text style={styles.sub}>Today's grind</Text>

        <CharacterCard
          tier={tier} xp={xp}
          progress={tier.progress}
          xpIntoLevel={tier.xpIntoLevel}
          xpForNext={tier.xpForNext}
          streak={streak}
        />

        {/* Big streak banner */}
        <View style={styles.streakBanner}>
          <Text style={styles.streakNum}>🔥 {streak}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakBigLabel}>Day streak</Text>
            <Text style={styles.streakSub}>
              {streak === 0 ? 'Log anything today to start' : `Keep it alive — log something today`}
            </Text>
          </View>
        </View>

        {/* Weight tracker card */}
        <View style={styles.card}>
          <View style={styles.weightHeader}>
            <Text style={styles.cardTitle}>Weight</Text>
            <Pressable onPress={() => setWeightModalOpen(true)} style={styles.logBtn}>
              <Text style={styles.logBtnText}>+ Log weight</Text>
            </Pressable>
          </View>
          <View style={styles.weightRow}>
            <WeightStat label="Start" value={`${swLb} lb`} color="#9ca3af" />
            <WeightStat label="Now" value={`${cwLb} lb`} color="#fff" />
            <WeightStat label="Goal" value={`${gwLb} lb`} color="#7cf0a1" />
          </View>
          <Text style={[styles.deltaText, { color: trendColor }]}>
            {deltaSign}{deltaLb} lb since start
          </Text>
          {weights.length > 1 && (
            <Sparkline data={weights.map((w) => w.weightKg * 2.2046)} color={trendColor} />
          )}
          <Pressable onPress={() => router.push('/growth')} style={styles.growthBtn}>
            <Text style={styles.growthBtnText}>📈 See Growth</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/insights')} style={styles.growthBtn}>
            <Text style={styles.growthBtnText}>Insights: food, sleep and training</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Quests" value={totalQuestsToday()} icon="⚔️" />
          <StatCard label="Cals left" value={Math.max(0, goals.calories - today.calories)} icon="🔥" />
          <StatCard label="Protein left" value={Math.max(0, goals.protein - today.protein) + 'g'} icon="🥩" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Macros</Text>
          <MacroBar label="Calories" current={today.calories} goal={goals.calories} color="#f97316" unit="" />
          <MacroBar label="Protein" current={today.protein} goal={goals.protein} color="#7cf0a1" />
          <MacroBar label="Carbs" current={today.carbs} goal={goals.carbs} color="#60a5fa" />
          <MacroBar label="Fat" current={today.fat} goal={goals.fat} color="#a78bfa" />
        </View>

        <Pressable
          onPress={() =>
            Alert.alert('Reset everything?', 'Wipes XP, macros, streak, quests, weights, workouts, profile.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetAll },
            ])
          }
          style={styles.resetBtn}
        >
          <Text style={styles.resetText}>Reset all data</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={weightModalOpen} transparent animationType="slide" onRequestClose={() => setWeightModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBg}
        >
          {/* Tap backdrop to close */}
          <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setWeightModalOpen(false); }}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            {/* Visible cancel bar above keyboard */}
            <View style={styles.modalTopBar}>
              <Pressable onPress={() => setWeightModalOpen(false)}>
                <Text style={styles.modalTopCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTopTitle}>Log Weight</Text>
              <Pressable onPress={onLogWeight}>
                <Text style={styles.modalTopDone}>Save +10 XP</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSub}>Today's weight in pounds</Text>
            <TextInput
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              style={styles.modalInput}
              placeholder="160.5"
              placeholderTextColor="#6b7280"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={onLogWeight}
            />
            <Pressable onPress={onLogWeight} style={[styles.btn, styles.btnPrimary, { marginTop: 14 }]}>
              <Text style={styles.btnPrimaryText}>Save (+10 XP)</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function WeightStat({ label, value, color }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.weightLabel}>{label}</Text>
      <Text style={[styles.weightValue, { color }]}>{value}</Text>
    </View>
  );
}

// Tiny inline sparkline drawn from divs — no chart lib needed.
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  return (
    <View style={styles.sparklineWrap}>
      {data.map((v, i) => {
        const h = ((v - min) / range) * 100;
        return (
          <View key={i} style={[styles.sparkBar, { height: `${Math.max(8, h)}%`, backgroundColor: color }]} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 16, paddingBottom: 60 },
  greeting: { color: '#fff', fontSize: 28, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 14, marginTop: -10 },

  streakBanner: {
    backgroundColor: '#11161f',
    borderColor: '#f97316',
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  streakNum: { color: '#f97316', fontSize: 36, fontWeight: '800' },
  streakBigLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
  streakSub: { color: '#9ca3af', fontSize: 12, marginTop: 2 },

  card: {
    backgroundColor: '#11161f',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 14 },

  weightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logBtn: { backgroundColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  logBtnText: { color: '#7cf0a1', fontSize: 12, fontWeight: '700' },
  weightRow: { flexDirection: 'row', marginTop: 6 },
  weightLabel: { color: '#6b7280', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  weightValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  deltaText: { textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 12 },
  sparklineWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    marginTop: 10,
    gap: 2,
  },
  sparkBar: { flex: 1, borderRadius: 1, opacity: 0.7 },

  statsRow: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: '#11161f',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 11, marginTop: 2 },

  resetBtn: { alignSelf: 'center', padding: 12 },
  resetText: { color: '#6b7280', fontSize: 12 },

  growthBtn: {
    marginTop: 12,
    backgroundColor: '#1f2937',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  growthBtnText: { color: '#7cf0a1', fontWeight: '700', fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#11161f', padding: 22, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 6,
    borderBottomColor: '#1f2937',
    borderBottomWidth: 1,
  },
  modalTopCancel: { color: '#9ca3af', fontSize: 15, fontWeight: '600' },
  modalTopTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalTopDone: { color: '#7cf0a1', fontSize: 15, fontWeight: '800' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalSub: { color: '#9ca3af', fontSize: 13, marginTop: 4, marginBottom: 12 },
  modalInput: {
    backgroundColor: '#0b0f17', borderColor: '#1f2937', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, color: '#fff', fontSize: 17,
  },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnGhost: { backgroundColor: '#1f2937' },
  btnGhostText: { color: '#d1d5db', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#7cf0a1' },
  btnPrimaryText: { color: '#0b0f17', fontWeight: '800' },
});
