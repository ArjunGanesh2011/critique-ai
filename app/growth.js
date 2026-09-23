import { useMemo } from 'react';
import { localDateKey, addDaysKey } from '../lib/dates';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '../lib/store';

export default function Growth() {
  const weights = useStore((s) => s.weights);
  const profile = useStore((s) => s.profile);

  // If the immutable starting weight isn't represented in the weights array
  // (because the user only has 1 entry from "today" that overwrote onboarding),
  // synthesize a starting point so the chart shows a real line.
  const chartData = useMemo(() => {
    const list = [...weights];
    const startKg = profile.startWeightKg;
    if (startKg && (list.length === 0 || Math.abs(list[0].weightKg - startKg) > 0.01)) {
      // Use a date 1 day before the earliest entry, or today minus 1 if list is empty
      const firstDate = list[0]?.date || addDaysKey(localDateKey(), -1);
      const startDate = addDaysKey(firstDate, -1);
      list.unshift({ date: startDate, weightKg: startKg, isStart: true });
    }
    return list;
  }, [weights, profile.startWeightKg]);

  const stats = useMemo(() => computeStats(chartData, profile), [chartData, profile]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Growth</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {chartData.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyText}>No weight logged yet</Text>
            <Text style={styles.emptySub}>Log your weight on the Home tab to start tracking.</Text>
          </View>
        ) : (
          <>
            {/* Big chart */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>WEIGHT OVER TIME</Text>
              <Chart data={chartData} goalKg={profile.goalWeightKg} />
              <View style={styles.legendRow}>
                <Legend color="#7cf0a1" label="You" />
                {profile.goalWeightKg && <Legend color="#fb923c" label="Goal" dashed />}
              </View>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <StatBox label="Total change" value={stats.deltaText} color={stats.deltaColor} />
              <StatBox label="Days tracked" value={`${stats.daysTracked}`} color="#fff" />
              <StatBox label="Avg per week" value={stats.weeklyText} color={stats.weeklyColor} />
              <StatBox label="To goal" value={stats.toGoalText} color="#7cf0a1" />
            </View>

            {/* Projection */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>GOAL PROJECTION</Text>
              {stats.projectionText ? (
                <Text style={styles.projection}>{stats.projectionText}</Text>
              ) : (
                <Text style={styles.projectionMuted}>Need at least 2 weight entries spanning 7+ days for projection.</Text>
              )}
            </View>

            {/* Tips */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>HOW TO REACH YOUR GOAL</Text>
              {tipsForGoal(profile.goal, stats).map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* History list */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>HISTORY ({chartData.length})</Text>
              {[...chartData].reverse().slice(0, 30).map((w, i, arr) => {
                const next = arr[i + 1];
                const diff = next ? (w.weightKg - next.weightKg) * 2.2046 : null;
                return (
                  <View key={w.date} style={styles.historyRow}>
                    <Text style={styles.historyDate}>
                      {w.isStart ? 'Start' : formatDate(w.date)}
                    </Text>
                    <Text style={styles.historyWeight}>{(w.weightKg * 2.2046).toFixed(1)} lb</Text>
                    {diff !== null && !w.isStart && (
                      <Text style={[styles.historyDiff, { color: diff > 0 ? '#fbbf24' : diff < 0 ? '#7cf0a1' : '#6b7280' }]}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </Text>
                    )}
                    {w.isStart && (
                      <Text style={[styles.historyDiff, { color: '#9ca3af', fontStyle: 'italic' }]}>baseline</Text>
                    )}
                  </View>
                );
              })}
              {chartData.length > 30 && (
                <Text style={styles.empty}>+ {chartData.length - 30} older entries</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// === Helpers ===

function computeStats(weights, profile) {
  if (weights.length === 0) return {};
  const first = weights[0];
  const last = weights[weights.length - 1];
  const startKg = first.weightKg;
  const currentKg = last.weightKg;
  const goalKg = profile.goalWeightKg;
  const deltaLb = (currentKg - startKg) * 2.2046;
  const days = daysBetween(first.date, last.date);
  const daysTracked = days + 1;
  const weeklyLb = days > 0 ? (deltaLb / days) * 7 : 0;

  const goalDir = goalKg && goalKg > startKg ? 'gain' : 'lose';
  const towardGoal = goalKg ? (goalDir === 'gain' ? deltaLb >= 0 : deltaLb <= 0) : true;

  const deltaSign = deltaLb >= 0 ? '+' : '';
  const weeklySign = weeklyLb >= 0 ? '+' : '';

  let toGoalText = '—';
  let projectionText = null;

  if (goalKg) {
    const remainingLb = (goalKg - currentKg) * 2.2046;
    toGoalText = `${remainingLb >= 0 ? '+' : ''}${remainingLb.toFixed(1)} lb`;
    if (days >= 7 && Math.abs(weeklyLb) > 0.05 && towardGoal) {
      const weeksToGoal = Math.abs(remainingLb) / Math.abs(weeklyLb);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.round(weeksToGoal * 7));
      projectionText = `At ${weeklySign}${weeklyLb.toFixed(2)} lb/week, you'll hit your goal of ${(goalKg * 2.2046).toFixed(1)} lb around ${formatDate(localDateKey(targetDate))} (~${Math.round(weeksToGoal)} weeks).`;
    } else if (days >= 7 && !towardGoal) {
      projectionText = `Heads up — you're moving away from your goal at ${weeklySign}${weeklyLb.toFixed(2)} lb/week. Adjust calories or training.`;
    }
  }

  return {
    daysTracked,
    deltaText: `${deltaSign}${deltaLb.toFixed(1)} lb`,
    deltaColor: deltaLb === 0 ? '#9ca3af' : towardGoal ? '#7cf0a1' : '#ef4444',
    weeklyText: `${weeklySign}${weeklyLb.toFixed(2)} lb`,
    weeklyColor: Math.abs(weeklyLb) < 0.05 ? '#9ca3af' : towardGoal ? '#7cf0a1' : '#fbbf24',
    toGoalText,
    projectionText,
    weeklyLb,
    towardGoal,
    goalDir,
  };
}

function tipsForGoal(goal, stats) {
  if (goal === 'lose') {
    return [
      'Aim for 1-2 lb/week loss — faster than that risks burning muscle.',
      'Hit your protein target every day. It preserves muscle while you cut.',
      'Add 8-10k steps per day. Cardio is calorie burn without killing recovery.',
      'Lift heavy 3-4× per week. Without resistance training, half your loss will be muscle.',
      'Weigh yourself at the same time daily (morning, after bathroom). Average over 7 days.',
    ];
  }
  if (goal === 'gain') {
    return [
      'Aim for 0.5-1 lb/week gain. Faster = more fat. Slower = no progress.',
      'Eat your calorie surplus consistently. Skipped meals = stalled gains.',
      'Hit protein target (~1g per lb of bodyweight) every single day.',
      'Progressive overload at the gym. Add weight or reps every session.',
      'Sleep 7-9 hours. Muscle is built during recovery, not in the gym.',
      stats?.weeklyLb !== undefined && Math.abs(stats.weeklyLb) < 0.1
        ? 'You\'ve been flat. Add 200 cal/day or check protein.'
        : 'Track weekly average — daily fluctuations are noise.',
    ].filter(Boolean);
  }
  return [
    'Maintenance = staying within ±2 lb of starting weight.',
    'Focus on body recomposition: lift hard, hit protein, calories at TDEE.',
    'Track strength PRs — that\'s the real progress signal at maintenance.',
  ];
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

// === Inline chart component (no chart libs) ===
function Chart({ data, goalKg }) {
  if (!data || data.length === 0) return null;
  const W = 320;
  const H = 180;
  const padX = 30;
  const padY = 16;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const lbValues = data.map((d) => d.weightKg * 2.2046);
  let minY = Math.min(...lbValues);
  let maxY = Math.max(...lbValues);
  if (goalKg) {
    minY = Math.min(minY, goalKg * 2.2046);
    maxY = Math.max(maxY, goalKg * 2.2046);
  }
  // pad range
  const span = Math.max(2, maxY - minY);
  minY = minY - span * 0.1;
  maxY = maxY + span * 0.1;
  const yRange = maxY - minY;

  const xFor = (i) => padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yFor = (v) => padY + innerH - ((v - minY) / yRange) * innerH;

  // Build segments
  const segments = data.slice(0, -1).map((d, i) => {
    const x1 = xFor(i), y1 = yFor(d.weightKg * 2.2046);
    const x2 = xFor(i + 1), y2 = yFor(data[i + 1].weightKg * 2.2046);
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return { x1, y1, len, angle };
  });

  const goalY = goalKg ? yFor(goalKg * 2.2046) : null;

  const yLabels = [maxY, (maxY + minY) / 2, minY];

  return (
    <View style={{ width: W, height: H, alignSelf: 'center', marginTop: 6 }}>
      {/* Y axis labels */}
      {yLabels.map((y, i) => (
        <Text key={i} style={[chartStyles.yLabel, { top: padY + (innerH * i) / 2 - 7 }]}>
          {y.toFixed(0)}
        </Text>
      ))}
      {/* Horizontal gridlines */}
      {[0, 1, 2].map((i) => (
        <View
          key={'g' + i}
          style={[
            chartStyles.gridLine,
            { top: padY + (innerH * i) / 2, left: padX, width: innerW },
          ]}
        />
      ))}
      {/* Goal line */}
      {goalY !== null && (
        <>
          <View style={[chartStyles.goalLine, { top: goalY, left: padX, width: innerW }]} />
          <Text style={[chartStyles.goalLabel, { top: goalY - 16, right: 4 }]}>
            Goal {(goalKg * 2.2046).toFixed(0)}
          </Text>
        </>
      )}
      {/* Line segments */}
      {segments.map((seg, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: seg.x1,
            top: seg.y1 - 1.5,
            width: seg.len,
            height: 3,
            backgroundColor: '#7cf0a1',
            transform: [{ rotateZ: `${seg.angle}deg` }],
            transformOrigin: 'left center',
            borderRadius: 2,
          }}
        />
      ))}
      {/* Points */}
      {data.map((d, i) => (
        <View
          key={'p' + i}
          style={{
            position: 'absolute',
            left: xFor(i) - 4,
            top: yFor(d.weightKg * 2.2046) - 4,
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: '#7cf0a1',
            borderColor: '#0b0f17', borderWidth: 1,
          }}
        />
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  yLabel: { position: 'absolute', left: 0, color: '#6b7280', fontSize: 10, width: 26, textAlign: 'right' },
  gridLine: { position: 'absolute', height: 1, backgroundColor: '#1f2937' },
  goalLine: { position: 'absolute', height: 1, backgroundColor: '#fb923c', opacity: 0.7 },
  goalLabel: { position: 'absolute', color: '#fb923c', fontSize: 9, fontWeight: '700' },
});

function StatBox({ label, value, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxLabel}>{label.toUpperCase()}</Text>
      <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
    </View>
  );
}

function Legend({ color, label, dashed }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color, opacity: dashed ? 0.7 : 1 }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomColor: '#1f2937', borderBottomWidth: 1,
  },
  back: { color: '#7cf0a1', fontSize: 15, fontWeight: '700', width: 60 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  container: { padding: 20, gap: 14, paddingBottom: 60 },
  emptyCard: { alignItems: 'center', padding: 40, marginTop: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#9ca3af', fontSize: 13, marginTop: 6, textAlign: 'center' },
  card: { backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1, borderRadius: 14, padding: 14 },
  sectionLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  legendRow: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#9ca3af', fontSize: 11, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1,
    borderRadius: 12, padding: 14,
  },
  statBoxLabel: { color: '#6b7280', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statBoxValue: { fontSize: 20, fontWeight: '800', marginTop: 6 },
  projection: { color: '#fff', fontSize: 14, lineHeight: 20 },
  projectionMuted: { color: '#9ca3af', fontSize: 13, fontStyle: 'italic' },
  tipRow: { flexDirection: 'row', gap: 8, paddingVertical: 5 },
  tipBullet: { color: '#7cf0a1', fontWeight: '800', fontSize: 14 },
  tipText: { color: '#d1d5db', fontSize: 13, flex: 1, lineHeight: 19 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomColor: '#1f2937', borderBottomWidth: 1,
  },
  historyDate: { color: '#9ca3af', fontSize: 13, flex: 1 },
  historyWeight: { color: '#fff', fontSize: 14, fontWeight: '700', minWidth: 70, textAlign: 'right' },
  historyDiff: { fontSize: 12, fontWeight: '700', minWidth: 55, textAlign: 'right' },
  empty: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});
