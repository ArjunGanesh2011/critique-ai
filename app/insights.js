import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { buildInsights, buildSeries, buildHistory } from '../lib/insights';
import { localDateKey, weekdayShort, monthDay } from '../lib/dates';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';

// Status colours are reserved for feedback tone and always ship with a word,
// never colour alone.
const TONE = {
  bad: { color: '#f87171', label: 'Needs work' },
  warn: { color: '#fbbf24', label: 'Watch' },
  info: { color: '#9ca3af', label: 'Note' },
  good: { color: '#34d399', label: 'On track' },
};
const VIEWS = ['Feedback', 'Trends', 'History'];
const dayLabel = (d) => `${weekdayShort(d.date)} ${monthDay(d.date)}`;

function ScoreCard({ result }) {
  const { overall, components } = result;
  const ready = components.nutrition !== null || components.sleep !== null;
  const rows = [
    ['Nutrition', components.nutrition],
    ['Sleep', components.sleep],
    ['Training', components.training],
    ['Logging', components.logging],
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>THIS WEEK</Text>
      {ready ? (
        <>
          <View style={styles.scoreRow}>
            <Text style={styles.score}>{overall}</Text>
            <Text style={styles.scoreOf}>out of 100</Text>
          </View>
          {rows.map(([name, v]) => (
            <View key={name} style={styles.compRow}>
              <Text style={styles.compName}>{name}</Text>
              <View style={styles.compTrack}>
                {v !== null && <View style={[styles.compFill, { width: `${v}%` }]} />}
              </View>
              <Text style={styles.compValue}>{v === null ? 'needs data' : v}</Text>
            </View>
          ))}
          <Text style={styles.footnote}>
            Weighted: nutrition 35%, sleep 30%, training 25%, logging 10%. Sections without enough data are left out.
          </Text>
        </>
      ) : (
        <Text style={styles.emptyText}>
          Log at least 3 days of food or 3 nights of sleep to get a weekly score.
        </Text>
      )}
    </View>
  );
}

function InsightCard({ item }) {
  const tone = TONE[item.tone];
  return (
    <View style={[styles.insight, { borderLeftColor: tone.color }]}>
      <View style={styles.insightHead}>
        <Text style={styles.area}>{item.area.toUpperCase()}</Text>
        <Text style={[styles.toneLabel, { color: tone.color }]}>{tone.label}</Text>
      </View>
      <Text style={styles.insightTitle}>{item.title}</Text>
      <Text style={styles.insightDetail}>{item.detail}</Text>
      {item.action && <Text style={styles.insightAction}>Try: {item.action}</Text>}
    </View>
  );
}

function HistoryRow({ day, open, onToggle }) {
  const g = day.goals || {};
  const pct = g.calories ? Math.min(1, day.calories / g.calories) : 0;
  const isToday = day.date === localDateKey();
  return (
    <Pressable onPress={onToggle} style={styles.histRow} accessibilityLabel={`${dayLabel(day)}, ${Math.round(day.calories)} calories`}>
      <View style={styles.histHead}>
        <Text style={styles.histDate}>{isToday ? 'Today' : dayLabel(day)}</Text>
        <Text style={styles.histKcal}>
          {Math.round(day.calories)}
          <Text style={styles.histGoal}> / {g.calories} kcal</Text>
        </Text>
      </View>
      <View style={styles.histTrack}>
        <View style={[styles.histFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.histMacros}>
        {Math.round(day.protein)}g protein, {Math.round(day.carbs)}g carbs, {Math.round(day.fat)}g fat, {Math.round(day.fiber)}g fiber
      </Text>
      {open && (
        <View style={styles.entries}>
          {day.entries.map((e) => (
            <View key={e.id} style={styles.entryRow}>
              <Text style={styles.entryName} numberOfLines={1}>{e.name}</Text>
              <Text style={styles.entryKcal}>{e.calories} kcal</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

export default function Insights() {
  const today = useStore((s) => s.today);
  const macroHistory = useStore((s) => s.macroHistory);
  const sleepLog = useStore((s) => s.sleepLog);
  const workoutLog = useStore((s) => s.workoutLog);
  const weights = useStore((s) => s.weights);
  const goals = useStore((s) => s.goals);
  const profile = useStore((s) => s.profile);
  const [view, setView] = useState('Feedback');
  const [openDay, setOpenDay] = useState(null);

  const deps = [today, macroHistory, sleepLog, workoutLog, weights, goals, profile];
  const state = { today, macroHistory, sleepLog, workoutLog, weights, goals, profile };
  const result = useMemo(() => buildInsights(state), deps); // eslint-disable-line react-hooks/exhaustive-deps
  const series = useMemo(() => buildSeries(state), deps); // eslint-disable-line react-hooks/exhaustive-deps
  const history = useMemo(() => buildHistory(state), deps); // eslint-disable-line react-hooks/exhaustive-deps

  const firstW = series.weight[0];
  const lastW = series.weight[series.weight.length - 1];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back">
          <Text style={styles.back}>{'<'} Back</Text>
        </Pressable>
        <Text style={styles.h1}>Insights</Text>
        <Text style={styles.sub}>Food, sleep, training and weight, read together.</Text>

        <ScoreCard result={result} />

        <View style={styles.segment}>
          {VIEWS.map((v) => (
            <Pressable key={v} onPress={() => setView(v)} style={[styles.segBtn, view === v && styles.segActive]}>
              <Text style={[styles.segText, view === v && styles.segTextActive]}>{v}</Text>
            </Pressable>
          ))}
        </View>

        {view === 'Feedback' && result.insights.map((item, i) => <InsightCard key={i} item={item} />)}

        {view === 'Trends' && (
          <>
            <BarChart title="Calories, last 14 days" data={series.calories} color="#f97316" unit=" kcal" formatLabel={dayLabel} />
            <BarChart title="Protein, last 14 days" data={series.protein} color="#7cf0a1" unit="g" formatLabel={dayLabel} />
            <BarChart
              title="Sleep, last 14 nights"
              data={series.sleep}
              color="#60a5fa"
              band={{ min: series.sleepTarget.min, max: series.sleepTarget.max, label: `Target ${series.sleepTarget.min} to ${series.sleepTarget.max}h` }}
              formatValue={(v) => `${v.toFixed(1)}h`}
              formatLabel={dayLabel}
              emptyText="Log nights in the Sleep tab"
            />
            <BarChart
              title="Workouts per week, last 6 weeks"
              data={series.workoutsPerWeek}
              color="#a78bfa"
              formatValue={(v) => `${v} session${v === 1 ? '' : 's'}`}
              formatLabel={(d) => `Week of ${monthDay(d.date)}`}
              emptyText="Finish a workout in the Gym tab"
            />
            <View style={styles.card}>
              {series.weight.length >= 2 ? (
                <LineChart
                  bare
                  title="Weight, last 60 days"
                  data={series.weight}
                  color="#7cf0a1"
                  unit=" lb"
                  defaultReadout={`${lastW.value - firstW.value >= 0 ? '+' : ''}${(lastW.value - firstW.value).toFixed(1)} lb`}
                  formatLabel={(d) => monthDay(d.date)}
                />
              ) : (
                <Text style={styles.emptyText}>Log two or more weigh-ins on the home screen.</Text>
              )}
              <Pressable onPress={() => router.push('/growth')} style={styles.linkBtn}>
                <Text style={styles.linkText}>Open the full weight chart</Text>
              </Pressable>
            </View>
          </>
        )}

        {view === 'History' && (
          history.length === 0 ? (
            <Text style={styles.emptyText}>
              Finished days show up here. Anything you log today appears at the top.
            </Text>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>{history.length} DAY{history.length === 1 ? '' : 'S'} LOGGED</Text>
              {history.map((d) => (
                <HistoryRow
                  key={d.date}
                  day={d}
                  open={openDay === d.date}
                  onToggle={() => setOpenDay(openDay === d.date ? null : d.date)}
                />
              ))}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 14, paddingBottom: 60 },
  back: { color: '#7cf0a1', fontSize: 14, fontWeight: '700' },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 13, marginTop: -8 },
  card: { backgroundColor: '#11161f', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937', gap: 10 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  emptyText: { color: '#9ca3af', fontSize: 13, lineHeight: 19 },
  footnote: { color: '#6b7280', fontSize: 11, lineHeight: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  score: { color: '#fff', fontSize: 44, fontWeight: '800' },
  scoreOf: { color: '#9ca3af', fontSize: 14 },
  compRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compName: { color: '#d1d5db', fontSize: 13, width: 76 },
  compTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#1f2937', overflow: 'hidden' },
  compFill: { height: 6, borderRadius: 3, backgroundColor: '#d1d5db' },
  compValue: { color: '#fff', fontSize: 12, fontWeight: '700', width: 72, textAlign: 'right' },
  segment: {
    flexDirection: 'row', gap: 6, backgroundColor: '#11161f', borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: '#1f2937',
  },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segActive: { backgroundColor: '#7cf0a1' },
  segText: { color: '#9ca3af', fontWeight: '700', fontSize: 13 },
  segTextActive: { color: '#0b0f17' },
  insight: {
    backgroundColor: '#11161f', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1f2937',
    borderLeftWidth: 4, gap: 6,
  },
  insightHead: { flexDirection: 'row', justifyContent: 'space-between' },
  area: { color: '#6b7280', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  toneLabel: { fontSize: 11, fontWeight: '800' },
  insightTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  insightDetail: { color: '#d1d5db', fontSize: 13, lineHeight: 19 },
  insightAction: { color: '#9ca3af', fontSize: 13, lineHeight: 19, fontStyle: 'italic' },
  linkBtn: { backgroundColor: '#1f2937', paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  linkText: { color: '#7cf0a1', fontWeight: '700', fontSize: 13 },
  histRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f2937', gap: 6 },
  histHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  histDate: { color: '#fff', fontSize: 14, fontWeight: '700' },
  histKcal: { color: '#fff', fontSize: 14, fontWeight: '700' },
  histGoal: { color: '#6b7280', fontSize: 12, fontWeight: '400' },
  histTrack: { height: 4, borderRadius: 2, backgroundColor: '#1f2937', overflow: 'hidden' },
  histFill: { height: 4, borderRadius: 2, backgroundColor: '#f97316' },
  histMacros: { color: '#9ca3af', fontSize: 12 },
  entries: { marginTop: 4, gap: 4 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  entryName: { color: '#d1d5db', fontSize: 12, flex: 1 },
  entryKcal: { color: '#9ca3af', fontSize: 12 },
});
