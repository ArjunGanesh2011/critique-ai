import { useEffect, useMemo, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useStore } from '../lib/store';
import { getExercise } from '../lib/exercises';

const REST_OPTIONS = [30, 60, 90, 120, 180];

export default function WorkoutRunner() {
  const { id } = useLocalSearchParams();
  const workouts = useStore((s) => s.workouts);
  const logWorkoutSession = useStore((s) => s.logWorkoutSession);

  const workout = useMemo(() => workouts.find((w) => w.id === id), [workouts, id]);

  // Build flat list of all sets across exercises so we can step through them.
  const allSets = useMemo(() => {
    if (!workout) return [];
    const arr = [];
    workout.exercises.forEach((ex, exIdx) => {
      ex.sets.forEach((set, setIdx) => {
        arr.push({
          exerciseId: ex.exerciseId,
          exIdx,
          setIdx,
          totalInExercise: ex.sets.length,
          targetReps: set.reps,
          targetWeightKg: set.weightKg,
        });
      });
    });
    return arr;
  }, [workout]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState([]); // array of { ...set, actualReps, actualWeightKg }
  const [restSec, setRestSec] = useState(90);
  const [restRemaining, setRestRemaining] = useState(0);
  const [startTime] = useState(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!workout) {
      Alert.alert('Workout not found', '', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }, [workout]);

  useEffect(() => {
    if (restRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setRestRemaining((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [restRemaining]);

  if (!workout) return <SafeAreaView style={styles.safe} />;

  const current = allSets[currentIdx];
  const isLastSet = currentIdx >= allSets.length - 1;
  const exDef = current ? getExercise(current.exerciseId) : null;

  const completeCurrentSet = () => {
    setCompleted([
      ...completed,
      {
        exerciseId: current.exerciseId,
        actualReps: current.targetReps,
        actualWeightKg: current.targetWeightKg,
      },
    ]);
    if (!isLastSet) {
      setCurrentIdx(currentIdx + 1);
      setRestRemaining(restSec);
    } else {
      finishWorkout();
    }
  };

  const skipRest = () => setRestRemaining(0);

  const finishWorkout = () => {
    const durationMin = Math.round((Date.now() - startTime) / 60000);
    const xp = logWorkoutSession({
      workoutId: workout.id,
      completedSets: completed,
      durationMin,
    });
    Alert.alert(
      'Workout complete 🎉',
      `+${xp} XP\n${completed.length} sets · ${durationMin} min\n\nNice work.`,
      [{ text: 'Done', onPress: () => router.back() }]
    );
  };

  const onAbort = () => {
    Alert.alert('Quit workout?', 'Your progress will not be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={onAbort}>
          <Text style={styles.quit}>Quit</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{workout.name}</Text>
        <Text style={styles.progress}>{currentIdx + 1}/{allSets.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Rest timer (visible only during rest) */}
        {restRemaining > 0 && (
          <View style={styles.restCard}>
            <Text style={styles.restLabel}>REST</Text>
            <Text style={styles.restTime}>
              {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}
            </Text>
            <Pressable onPress={skipRest} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip rest</Text>
            </Pressable>
          </View>
        )}

        {/* Current set */}
        <View style={styles.setCard}>
          <Text style={styles.exName}>{exDef?.name || current?.exerciseId}</Text>
          <Text style={styles.setIndicator}>
            Set {current.setIdx + 1} of {current.totalInExercise}
          </Text>

          <View style={styles.targetRow}>
            <View style={styles.targetBox}>
              <Text style={styles.targetLabel}>REPS</Text>
              <Text style={styles.targetValue}>{current.targetReps}</Text>
            </View>
            <View style={styles.targetBox}>
              <Text style={styles.targetLabel}>WEIGHT</Text>
              <Text style={styles.targetValue}>
                {current.targetWeightKg > 0
                  ? `${Math.round(current.targetWeightKg * 2.2046 * 10) / 10} lb`
                  : 'BW'}
              </Text>
            </View>
          </View>

          <Pressable onPress={completeCurrentSet} style={styles.doneBtn}>
            <Text style={styles.doneText}>{isLastSet ? '🎉 Finish workout' : '✓ Set done'}</Text>
          </Pressable>
        </View>

        {/* Rest duration picker */}
        <View style={styles.restPickCard}>
          <Text style={styles.sectionLabel}>REST BETWEEN SETS</Text>
          <View style={styles.restRow}>
            {REST_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setRestSec(opt)}
                style={[styles.restChip, restSec === opt && styles.restChipActive]}
              >
                <Text style={[styles.restChipText, restSec === opt && styles.restChipTextActive]}>
                  {opt < 60 ? `${opt}s` : `${Math.floor(opt / 60)}m${opt % 60 ? ` ${opt % 60}s` : ''}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Up next preview */}
        {currentIdx + 1 < allSets.length && (
          <View style={styles.nextCard}>
            <Text style={styles.sectionLabel}>UP NEXT</Text>
            <Text style={styles.nextText}>
              {getExercise(allSets[currentIdx + 1].exerciseId)?.name} — Set {allSets[currentIdx + 1].setIdx + 1}/{allSets[currentIdx + 1].totalInExercise}
            </Text>
          </View>
        )}

        {/* Done sets log */}
        {completed.length > 0 && (
          <View style={styles.logCard}>
            <Text style={styles.sectionLabel}>DONE THIS SESSION</Text>
            {completed.slice(-5).map((s, i) => (
              <Text key={i} style={styles.logRow}>
                ✓ {getExercise(s.exerciseId)?.name} — {s.actualReps}{s.actualWeightKg > 0 ? ` × ${Math.round(s.actualWeightKg * 2.2046 * 10) / 10}lb` : ''}
              </Text>
            ))}
            {completed.length > 5 && <Text style={styles.logMore}>+ {completed.length - 5} more</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomColor: '#1f2937', borderBottomWidth: 1,
  },
  quit: { color: '#ef4444', fontWeight: '700', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  progress: { color: '#9ca3af', fontSize: 13, fontWeight: '700', minWidth: 50, textAlign: 'right' },

  body: { padding: 20, gap: 14, paddingBottom: 60 },

  restCard: {
    backgroundColor: '#7cf0a1', borderRadius: 16, padding: 28, alignItems: 'center',
  },
  restLabel: { color: '#0b0f17', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  restTime: { color: '#0b0f17', fontSize: 56, fontWeight: '800', marginTop: 6 },
  skipBtn: { marginTop: 14, backgroundColor: '#0b0f17', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  skipText: { color: '#7cf0a1', fontWeight: '700' },

  setCard: { backgroundColor: '#11161f', borderRadius: 16, padding: 22, gap: 14, borderColor: '#1f2937', borderWidth: 1 },
  exName: { color: '#fff', fontSize: 24, fontWeight: '800' },
  setIndicator: { color: '#9ca3af', fontSize: 14 },
  targetRow: { flexDirection: 'row', gap: 14, marginVertical: 10 },
  targetBox: { flex: 1, backgroundColor: '#0b0f17', borderRadius: 12, padding: 18, alignItems: 'center' },
  targetLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  targetValue: { color: '#7cf0a1', fontSize: 36, fontWeight: '800', marginTop: 4 },
  doneBtn: { backgroundColor: '#7cf0a1', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  doneText: { color: '#0b0f17', fontSize: 17, fontWeight: '800' },

  restPickCard: { backgroundColor: '#11161f', borderRadius: 12, padding: 14, borderColor: '#1f2937', borderWidth: 1 },
  sectionLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  restRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  restChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#0b0f17', borderColor: '#1f2937', borderWidth: 1 },
  restChipActive: { backgroundColor: '#7cf0a1', borderColor: '#7cf0a1' },
  restChipText: { color: '#9ca3af', fontWeight: '700' },
  restChipTextActive: { color: '#0b0f17' },

  nextCard: { backgroundColor: '#11161f', borderRadius: 12, padding: 14, borderColor: '#1f2937', borderWidth: 1 },
  nextText: { color: '#fff', fontSize: 14 },

  logCard: { backgroundColor: '#11161f', borderRadius: 12, padding: 14, borderColor: '#1f2937', borderWidth: 1 },
  logRow: { color: '#7cf0a1', fontSize: 13, paddingVertical: 4 },
  logMore: { color: '#6b7280', fontSize: 12, fontStyle: 'italic', marginTop: 6 },
});
