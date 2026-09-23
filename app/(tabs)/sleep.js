import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';
import { sleepTarget, buildSeries } from '../../lib/insights';
import {
  localDateKey, addDaysKey, weekdayShort, monthDay, lastNDays,
  hmToMinutes, minutesToHm, hm12,
} from '../../lib/dates';
import BarChart from '../../components/BarChart';

const QUALITY = ['Awful', 'Poor', 'OK', 'Good', 'Great'];
const STEP_MIN = 15;
const SLEEP_COLOR = '#60a5fa';

function durationText(bed, wake) {
  let mins = hmToMinutes(wake) - hmToMinutes(bed);
  if (mins <= 0) mins += 1440;
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

function TimeStepper({ label, value, onChange }) {
  const shift = (d) => onChange(minutesToHm(hmToMinutes(value) + d));
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepRow}>
        <Pressable onPress={() => shift(-STEP_MIN)} style={styles.stepBtn} accessibilityLabel={`${label} 15 minutes earlier`}>
          <Text style={styles.stepText}>-</Text>
        </Pressable>
        <Text style={styles.timeText}>{hm12(value)}</Text>
        <Pressable onPress={() => shift(STEP_MIN)} style={styles.stepBtn} accessibilityLabel={`${label} 15 minutes later`}>
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Sleep() {
  const sleepLog = useStore((s) => s.sleepLog);
  const logSleep = useStore((s) => s.logSleep);
  const deleteSleep = useStore((s) => s.deleteSleep);
  const age = useStore((s) => s.profile.age);
  const target = sleepTarget(age);
  const today = localDateKey();

  // A night is filed under the morning you woke up.
  const [date, setDate] = useState(today);
  const existing = sleepLog.find((n) => n.date === date);
  const lastNight = sleepLog[sleepLog.length - 1];
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [saved, setSaved] = useState(false);

  // Prefill from that night if it exists, otherwise from your usual times.
  useEffect(() => {
    const src = existing || lastNight;
    setBedtime(src?.bedtime || '23:00');
    setWakeTime(src?.wakeTime || '07:00');
    setQuality(existing?.quality || 3);
    setSaved(false);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSave = () => {
    logSleep({ date, bedtime, wakeTime, quality });
    setSaved(true);
  };

  const stats = useMemo(() => {
    const week = lastNDays(7).map((k) => sleepLog.find((n) => n.date === k)).filter(Boolean);
    if (week.length === 0) return null;
    const avg = week.reduce((s, n) => s + n.hours, 0) / week.length;
    const onTarget = week.filter((n) => n.hours >= target.min).length;
    return { avg, onTarget, count: week.length };
  }, [sleepLog, target.min]);

  const series = useMemo(() => buildSeries({ sleepLog, profile: { age } }).sleep, [sleepLog, age]);
  const nightLabel = date === today ? 'Last night' : `${weekdayShort(date)}, ${monthDay(date)}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Sleep</Text>
        <Text style={styles.sub}>Your target is {target.label}.</Text>

        <View style={styles.card}>
          <View style={styles.dateRow}>
            <Pressable onPress={() => setDate(addDaysKey(date, -1))} style={styles.navBtn} accessibilityLabel="Previous night">
              <Text style={styles.navText}>{'<'}</Text>
            </Pressable>
            <Text style={styles.dateText}>{nightLabel}</Text>
            <Pressable
              onPress={() => date < today && setDate(addDaysKey(date, 1))}
              style={[styles.navBtn, date >= today && styles.navDisabled]}
              disabled={date >= today}
              accessibilityLabel="Next night"
            >
              <Text style={styles.navText}>{'>'}</Text>
            </Pressable>
          </View>

          <View style={styles.timesRow}>
            <TimeStepper label="Bedtime" value={bedtime} onChange={(v) => { setBedtime(v); setSaved(false); }} />
            <TimeStepper label="Woke up" value={wakeTime} onChange={(v) => { setWakeTime(v); setSaved(false); }} />
          </View>

          <Text style={styles.duration}>{durationText(bedtime, wakeTime)} of sleep</Text>

          <Text style={styles.stepLabel}>How did you sleep?</Text>
          <View style={styles.qualityRow}>
            {QUALITY.map((q, i) => (
              <Pressable
                key={q}
                onPress={() => { setQuality(i + 1); setSaved(false); }}
                style={[styles.qChip, quality === i + 1 && styles.qChipActive]}
              >
                <Text style={[styles.qText, quality === i + 1 && styles.qTextActive]}>{q}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={onSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>{saved ? 'Saved' : existing ? 'Update night' : 'Save night'}</Text>
          </Pressable>
        </View>

        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.avg.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>7-night average</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stats.onTarget}/{stats.count}</Text>
              <Text style={styles.statLabel}>nights on target</Text>
            </View>
          </View>
        )}

        <BarChart
          title="Hours slept, last 14 nights"
          data={series}
          color={SLEEP_COLOR}
          band={{ min: target.min, max: target.max, label: `Target ${target.min} to ${target.max}h` }}
          formatValue={(v) => `${v.toFixed(1)}h`}
          formatLabel={(d) => `${weekdayShort(d.date)} ${monthDay(d.date)}`}
          emptyText="Log a night above to start the chart"
        />

        <Pressable onPress={() => router.push('/insights')} style={styles.linkBtn}>
          <Text style={styles.linkText}>See how sleep connects to food and training</Text>
        </Pressable>

        {sleepLog.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>RECENT NIGHTS</Text>
            {[...sleepLog].reverse().slice(0, 10).map((n) => {
              const short = n.hours < target.min;
              return (
                <View key={n.date} style={styles.nightRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nightDate}>{weekdayShort(n.date)}, {monthDay(n.date)}</Text>
                    <Text style={styles.nightMeta}>
                      {hm12(n.bedtime)} to {hm12(n.wakeTime)}, {QUALITY[(n.quality || 3) - 1]}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.nightHours, short && styles.nightShort]}>{n.hours.toFixed(1)}h</Text>
                    {short && <Text style={styles.underLabel}>under</Text>}
                  </View>
                  <Pressable onPress={() => deleteSleep(n.date)} style={styles.delBtn} accessibilityLabel={`Delete ${monthDay(n.date)}`}>
                    <Text style={styles.delText}>✕</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 14, paddingBottom: 60 },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 13, marginTop: -8 },
  card: { backgroundColor: '#11161f', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937', gap: 12 },
  sectionLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 40, height: 36, borderRadius: 10, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  navDisabled: { opacity: 0.3 },
  navText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  dateText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timesRow: { flexDirection: 'row', gap: 10 },
  stepper: { flex: 1, gap: 6 },
  stepLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0b0f17', borderRadius: 10, padding: 4,
  },
  stepBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center' },
  stepText: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 22 },
  timeText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  duration: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  qualityRow: { flexDirection: 'row', gap: 6 },
  qChip: {
    flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
    borderColor: '#1f2937', backgroundColor: '#0b0f17', alignItems: 'center',
  },
  qChipActive: { backgroundColor: '#7cf0a1', borderColor: '#7cf0a1' },
  qText: { color: '#9ca3af', fontSize: 11, fontWeight: '700' },
  qTextActive: { color: '#0b0f17' },
  saveBtn: { backgroundColor: '#7cf0a1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#0b0f17', fontWeight: '800', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: '#11161f', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#1f2937' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  linkBtn: { backgroundColor: '#1f2937', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  linkText: { color: '#7cf0a1', fontWeight: '700', fontSize: 13 },
  nightRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  nightDate: { color: '#fff', fontSize: 14, fontWeight: '600' },
  nightMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  nightHours: { color: '#fff', fontSize: 15, fontWeight: '800' },
  nightShort: { color: '#fbbf24' },
  underLabel: { color: '#fbbf24', fontSize: 10, fontWeight: '700' },
  delBtn: { padding: 6 },
  delText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});
