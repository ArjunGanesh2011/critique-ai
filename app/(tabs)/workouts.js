import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';
import { EXERCISES, CATEGORIES, getExercise } from '../../lib/exercises';

export default function Workouts() {
  const workouts = useStore((s) => s.workouts);
  const saveWorkout = useStore((s) => s.saveWorkout);
  const deleteWorkout = useStore((s) => s.deleteWorkout);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const startNew = () => {
    setEditing({
      id: Date.now().toString(),
      name: '',
      exercises: [],
    });
    setEditorOpen(true);
  };

  const startEdit = (w) => {
    setEditing(JSON.parse(JSON.stringify(w))); // deep clone
    setEditorOpen(true);
  };

  const onSaveEditor = () => {
    if (!editing.name.trim()) return Alert.alert('Need a name', 'Give your workout a name like "Push Day A".');
    if (editing.exercises.length === 0) return Alert.alert('Empty workout', 'Add at least one exercise.');
    saveWorkout(editing);
    setEditorOpen(false);
    setEditing(null);
  };

  const onDelete = (id, name) => {
    Alert.alert('Delete workout?', `"${name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(id) },
    ]);
  };

  const onRun = (w) => {
    router.push(`/workout-runner?id=${w.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Workouts</Text>
          <Pressable onPress={startNew} style={styles.newBtn}>
            <Text style={styles.newBtnText}>+ New</Text>
          </Pressable>
        </View>
        <Text style={styles.sub}>Build named workouts. Tap to run with rest timer.</Text>

        {workouts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySub}>Tap + New to build your first one (e.g. "Push Day A")</Text>
          </View>
        ) : workouts.map((w) => {
          const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0);
          return (
            <View key={w.id} style={styles.workoutCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutName}>{w.name}</Text>
                <Text style={styles.workoutMeta}>
                  {w.exercises.length} exercises · {totalSets} sets
                </Text>
              </View>
              <Pressable onPress={() => startEdit(w)} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>✏️</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(w.id, w.name)} style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>🗑️</Text>
              </Pressable>
              <Pressable onPress={() => onRun(w)} style={styles.runBtn}>
                <Text style={styles.runBtnText}>▶ Run</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {editing && (
        <Editor
          visible={editorOpen}
          workout={editing}
          onChange={setEditing}
          onClose={() => setEditorOpen(false)}
          onSave={onSaveEditor}
        />
      )}
    </SafeAreaView>
  );
}

function Editor({ visible, workout, onChange, onClose, onSave }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const addExercise = (exercise) => {
    onChange({
      ...workout,
      exercises: [
        ...workout.exercises,
        { exerciseId: exercise.id, sets: [{ reps: 10, weightKg: 0 }] },
      ],
    });
    setPickerOpen(false);
  };

  const updateSet = (exIdx, setIdx, patch) => {
    const exercises = [...workout.exercises];
    exercises[exIdx].sets[setIdx] = { ...exercises[exIdx].sets[setIdx], ...patch };
    onChange({ ...workout, exercises });
  };

  const addSet = (exIdx) => {
    const exercises = [...workout.exercises];
    const last = exercises[exIdx].sets[exercises[exIdx].sets.length - 1] || { reps: 10, weightKg: 0 };
    exercises[exIdx].sets.push({ ...last });
    onChange({ ...workout, exercises });
  };

  const removeSet = (exIdx, setIdx) => {
    const exercises = [...workout.exercises];
    exercises[exIdx].sets.splice(setIdx, 1);
    if (exercises[exIdx].sets.length === 0) exercises.splice(exIdx, 1);
    onChange({ ...workout, exercises });
  };

  const removeExercise = (exIdx) => {
    const exercises = workout.exercises.filter((_, i) => i !== exIdx);
    onChange({ ...workout, exercises });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.editorHeader}>
          <Pressable onPress={onClose}><Text style={styles.closeBtn}>Cancel</Text></Pressable>
          <Text style={styles.editorTitle}>Edit Workout</Text>
          <Pressable onPress={onSave}><Text style={styles.saveBtn}>Save</Text></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>Workout name</Text>
          <TextInput
            value={workout.name}
            onChangeText={(name) => onChange({ ...workout, name })}
            style={styles.input}
            placeholder="Push Day A"
            placeholderTextColor="#6b7280"
          />

          {workout.exercises.map((ex, exIdx) => {
            const exDef = getExercise(ex.exerciseId);
            return (
              <View key={exIdx} style={styles.exCard}>
                <View style={styles.exHeader}>
                  <Text style={styles.exName}>{exDef?.name || ex.exerciseId}</Text>
                  <Pressable onPress={() => removeExercise(exIdx)}>
                    <Text style={styles.delText}>✕</Text>
                  </Pressable>
                </View>
                <View style={styles.setHeaderRow}>
                  <Text style={[styles.setColLabel, { flex: 0.6 }]}>SET</Text>
                  <Text style={[styles.setColLabel, { flex: 1 }]}>REPS</Text>
                  <Text style={[styles.setColLabel, { flex: 1 }]}>WEIGHT (lb)</Text>
                  <Text style={[styles.setColLabel, { flex: 0.5 }]}> </Text>
                </View>
                {ex.sets.map((set, setIdx) => (
                  <View key={setIdx} style={styles.setRow}>
                    <Text style={[styles.setNum, { flex: 0.6 }]}>{setIdx + 1}</Text>
                    <TextInput
                      style={[styles.setInput, { flex: 1 }]}
                      value={String(set.reps)}
                      onChangeText={(v) => updateSet(exIdx, setIdx, { reps: parseInt(v.replace(/[^0-9]/g, ''), 10) || 0 })}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.setInput, { flex: 1 }]}
                      value={String(Math.round((set.weightKg * 2.2046) * 10) / 10)}
                      onChangeText={(v) => {
                        const lb = parseFloat(v.replace(/[^0-9.]/g, '')) || 0;
                        updateSet(exIdx, setIdx, { weightKg: lb / 2.2046 });
                      }}
                      keyboardType="decimal-pad"
                    />
                    <Pressable onPress={() => removeSet(exIdx, setIdx)} style={{ flex: 0.5, alignItems: 'center' }}>
                      <Text style={styles.delText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={() => addSet(exIdx)} style={styles.addSetBtn}>
                  <Text style={styles.addSetText}>+ Add set</Text>
                </Pressable>
              </View>
            );
          })}

          <Pressable onPress={() => setPickerOpen(true)} style={styles.addExerciseBtn}>
            <Text style={styles.addExerciseText}>+ Add exercise</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
      />
    </Modal>
  );
}

function ExercisePicker({ visible, onClose, onPick }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (category !== 'all' && e.category !== category) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, category]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.editorHeader}>
          <Pressable onPress={onClose}><Text style={styles.closeBtn}>Cancel</Text></Pressable>
          <Text style={styles.editorTitle}>Pick Exercise</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={{ padding: 16, gap: 10 }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search ~150 exercises"
            placeholderTextColor="#6b7280"
            style={styles.input}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <Pressable onPress={() => setCategory('all')} style={[styles.catChip, category === 'all' && styles.catChipActive]}>
              <Text style={[styles.catChipText, category === 'all' && styles.catChipTextActive]}>All</Text>
            </Pressable>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[styles.catChip, category === c.key && styles.catChipActive]}
              >
                <Text style={[styles.catChipText, category === c.key && styles.catChipTextActive]}>
                  {c.emoji} {c.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
          {filtered.map((e) => (
            <Pressable key={e.id} onPress={() => onPick(e)} style={styles.pickerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerName}>{e.name}</Text>
                <Text style={styles.pickerMeta}>{e.category} · {e.equipment}</Text>
              </View>
              <Text style={styles.pickerArrow}>＋</Text>
            </Pressable>
          ))}
          {filtered.length === 0 && (
            <Text style={styles.empty}>No matches. Try clearing filters.</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 12, paddingBottom: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 13, marginTop: -4 },
  newBtn: { backgroundColor: '#7cf0a1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newBtnText: { color: '#0b0f17', fontWeight: '800' },

  emptyCard: { alignItems: 'center', padding: 40, marginTop: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#9ca3af', fontSize: 13, marginTop: 6, textAlign: 'center' },

  workoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1,
    borderRadius: 14, padding: 14,
  },
  workoutName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  workoutMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  iconBtn: { padding: 6 },
  iconBtnText: { fontSize: 18 },
  runBtn: { backgroundColor: '#7cf0a1', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  runBtnText: { color: '#0b0f17', fontWeight: '800', fontSize: 13 },

  editorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomColor: '#1f2937', borderBottomWidth: 1,
  },
  editorTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { color: '#9ca3af', fontSize: 15, width: 60 },
  saveBtn: { color: '#7cf0a1', fontSize: 15, fontWeight: '800', width: 60, textAlign: 'right' },
  label: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 15,
  },

  exCard: {
    backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1,
    borderRadius: 12, padding: 12, gap: 8,
  },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 4 },
  setColLabel: { color: '#6b7280', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  setNum: { color: '#7cf0a1', fontWeight: '700', fontSize: 14 },
  setInput: {
    backgroundColor: '#0b0f17', borderColor: '#1f2937', borderWidth: 1,
    borderRadius: 8, paddingVertical: 8, color: '#fff', textAlign: 'center', fontSize: 14,
  },
  delText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  addSetBtn: { padding: 8 },
  addSetText: { color: '#7cf0a1', fontSize: 13, fontWeight: '700' },
  addExerciseBtn: {
    padding: 16, alignItems: 'center',
    borderColor: '#7cf0a1', borderWidth: 1, borderStyle: 'dashed', borderRadius: 12,
  },
  addExerciseText: { color: '#7cf0a1', fontWeight: '700' },

  catChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#11161f', borderRadius: 16, borderColor: '#1f2937', borderWidth: 1 },
  catChipActive: { backgroundColor: '#7cf0a1', borderColor: '#7cf0a1' },
  catChipText: { color: '#d1d5db', fontSize: 12, fontWeight: '700' },
  catChipTextActive: { color: '#0b0f17' },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomColor: '#1f2937', borderBottomWidth: 1,
  },
  pickerName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  pickerMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  pickerArrow: { color: '#7cf0a1', fontSize: 24, fontWeight: '800', marginLeft: 8 },
  empty: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
});
