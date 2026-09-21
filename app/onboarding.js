import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useStore, calcGoalsFromProfile } from '../lib/store';

const STEPS = ['name', 'sex', 'age', 'height', 'weight', 'goalWeight', 'goal', 'activity', 'preferences', 'review'];

export default function Onboarding() {
  const setProfile = useStore((s) => s.setProfile);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const profile = useStore((s) => s.profile);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    name: profile.name || 'Arjun',
    sex: 'male',
    age: '',
    heightFt: '',
    heightIn: '',
    weightLb: '',
    goalWeightLb: '',
    goal: 'gain',
    activityLevel: 'moderate',
    dietPreferences: '',
  });

  const update = (k, v) => setDraft({ ...draft, [k]: v });

  const next = () => {
    // simple per-step validation
    const s = STEPS[step];
    if (s === 'name' && !draft.name.trim()) return Alert.alert('Need a name');
    if (s === 'age' && (!draft.age || +draft.age <= 0)) return Alert.alert('Enter your age');
    if (s === 'height' && (!draft.heightFt || +draft.heightFt <= 0)) return Alert.alert('Enter height (feet)');
    if (s === 'weight' && (!draft.weightLb || +draft.weightLb <= 0)) return Alert.alert('Enter weight (lb)');
    if (s === 'goalWeight' && (!draft.goalWeightLb || +draft.goalWeightLb <= 0)) return Alert.alert('Enter goal weight');
    setStep(Math.min(step + 1, STEPS.length - 1));
  };

  const back = () => setStep(Math.max(0, step - 1));

  const finish = () => {
    const heightCm = ((parseFloat(draft.heightFt) || 0) * 12 + (parseFloat(draft.heightIn) || 0)) * 2.54;
    const weightKg = (parseFloat(draft.weightLb) || 0) / 2.2046;
    const goalWeightKg = (parseFloat(draft.goalWeightLb) || 0) / 2.2046;
    setProfile({
      name: draft.name,
      sex: draft.sex,
      age: parseInt(draft.age, 10),
      heightCm: Math.round(heightCm),
      // 4 decimal precision so converting back to lb is exact (1 lb = 0.453592 kg)
      weightKg: Math.round(weightKg * 10000) / 10000,
      goalWeightKg: Math.round(goalWeightKg * 10000) / 10000,
      goal: draft.goal,
      activityLevel: draft.activityLevel,
      dietPreferences: draft.dietPreferences,
    });
    completeOnboarding();
    router.replace('/');
  };

  const stepContent = () => {
    const s = STEPS[step];
    if (s === 'name') return (
      <Field label="What's your name?" hint="Just a first name works.">
        <TextInput value={draft.name} onChangeText={(v) => update('name', v)} style={styles.input} placeholder="Arjun" placeholderTextColor="#6b7280" />
      </Field>
    );
    if (s === 'sex') return (
      <Field label="Biological sex" hint="Used to estimate calorie needs accurately.">
        <Choice value="male" current={draft.sex} onPress={() => update('sex', 'male')} label="Male" />
        <Choice value="female" current={draft.sex} onPress={() => update('sex', 'female')} label="Female" />
      </Field>
    );
    if (s === 'age') return (
      <Field label="How old are you?" hint="No limits. Honest answer = better targets.">
        <TextInput value={draft.age} onChangeText={(v) => update('age', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} placeholder="24" placeholderTextColor="#6b7280" />
      </Field>
    );
    if (s === 'height') return (
      <Field label="Your height" hint="Feet and inches.">
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Feet</Text>
            <TextInput value={draft.heightFt} onChangeText={(v) => update('heightFt', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} placeholder="5" placeholderTextColor="#6b7280" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Inches</Text>
            <TextInput value={draft.heightIn} onChangeText={(v) => update('heightIn', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} placeholder="10" placeholderTextColor="#6b7280" />
          </View>
        </View>
      </Field>
    );
    if (s === 'weight') return (
      <Field label="Current weight (lb)" hint="This becomes your starting weight for tracking progress.">
        <TextInput value={draft.weightLb} onChangeText={(v) => update('weightLb', v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={styles.input} placeholder="160" placeholderTextColor="#6b7280" />
      </Field>
    );
    if (s === 'goalWeight') return (
      <Field label="Goal weight (lb)" hint="Where you want to be. Aim realistic.">
        <TextInput value={draft.goalWeightLb} onChangeText={(v) => update('goalWeightLb', v.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" style={styles.input} placeholder="180" placeholderTextColor="#6b7280" />
      </Field>
    );
    if (s === 'goal') return (
      <Field label="Primary goal" hint="Used to set your daily calories.">
        <Choice value="lose" current={draft.goal} onPress={() => update('goal', 'lose')} label="🔻 Lose fat" desc="Cut ~500 cal below maintenance" />
        <Choice value="maintain" current={draft.goal} onPress={() => update('goal', 'maintain')} label="🟰 Maintain" desc="Recomp at maintenance calories" />
        <Choice value="gain" current={draft.goal} onPress={() => update('goal', 'gain')} label="🔺 Build muscle" desc="Lean bulk +350 cal above maintenance" />
      </Field>
    );
    if (s === 'activity') return (
      <Field label="Activity level" hint="Daily activity outside of workouts.">
        <Choice value="sedentary" current={draft.activityLevel} onPress={() => update('activityLevel', 'sedentary')} label="🛋️ Sedentary" desc="Desk job, no exercise" />
        <Choice value="light" current={draft.activityLevel} onPress={() => update('activityLevel', 'light')} label="🚶 Light" desc="Light walking, 1-2 workouts/week" />
        <Choice value="moderate" current={draft.activityLevel} onPress={() => update('activityLevel', 'moderate')} label="🏃 Moderate" desc="3-5 workouts/week" />
        <Choice value="active" current={draft.activityLevel} onPress={() => update('activityLevel', 'active')} label="💪 Active" desc="6-7 workouts/week" />
        <Choice value="very_active" current={draft.activityLevel} onPress={() => update('activityLevel', 'very_active')} label="🔥 Very Active" desc="2-a-days, athlete" />
      </Field>
    );
    if (s === 'preferences') return (
      <Field label="Diet preferences / restrictions" hint="Optional. e.g. 'vegetarian, no nuts, lactose intolerant'. Used by AI diet planner.">
        <TextInput
          value={draft.dietPreferences}
          onChangeText={(v) => update('dietPreferences', v)}
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          multiline
          placeholder="e.g. no pork, prefer high-protein, hate seafood"
          placeholderTextColor="#6b7280"
        />
      </Field>
    );
    if (s === 'review') {
      const heightCm = ((parseFloat(draft.heightFt) || 0) * 12 + (parseFloat(draft.heightIn) || 0)) * 2.54;
      const weightKg = (parseFloat(draft.weightLb) || 0) / 2.2046;
      const bmi = heightCm > 0 ? (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1) : '—';
      const goals = calcGoalsFromProfile({
        age: +draft.age, sex: draft.sex,
        heightCm, weightKg,
        goal: draft.goal,
        activityLevel: draft.activityLevel,
      });
      return (
        <View style={{ gap: 14 }}>
          <Text style={styles.label}>Your plan</Text>
          <View style={styles.reviewCard}>
            <ReviewRow k="BMI" v={bmi} />
            <ReviewRow k="Daily calories" v={`${goals?.calories || '—'} kcal`} />
            <ReviewRow k="Protein" v={`${goals?.protein || '—'} g`} />
            <ReviewRow k="Carbs"   v={`${goals?.carbs   || '—'} g`} />
            <ReviewRow k="Fat"     v={`${goals?.fat     || '—'} g`} />
          </View>
          <Text style={styles.hint}>You can change these anytime in the Profile section.</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Set up your profile</Text>
          <Text style={styles.sub}>Step {step + 1} of {STEPS.length}</Text>
          <View style={styles.progressOuter}>
            <View style={[styles.progressInner, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
          </View>

          <View style={{ marginTop: 24 }}>
            {stepContent()}
          </View>

          <View style={styles.btnRow}>
            <Pressable onPress={back} style={[styles.btn, styles.btnGhost, step === 0 && { opacity: 0.4 }]} disabled={step === 0}>
              <Text style={styles.btnGhostText}>Back</Text>
            </Pressable>
            {step < STEPS.length - 1 ? (
              <Pressable onPress={next} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable onPress={finish} style={[styles.btn, styles.btnPrimary]}>
                <Text style={styles.btnPrimaryText}>Start</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, hint, children }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.label}>{label}</Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
      {children}
    </View>
  );
}

function Choice({ value, current, onPress, label, desc }) {
  const sel = value === current;
  return (
    <Pressable onPress={onPress} style={[styles.choice, sel && styles.choiceSelected]}>
      <Text style={[styles.choiceLabel, sel && styles.choiceLabelSelected]}>{label}</Text>
      {!!desc && <Text style={[styles.choiceDesc, sel && { color: '#0b0f17aa' }]}>{desc}</Text>}
    </Pressable>
  );
}

function ReviewRow({ k, v }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewKey}>{k}</Text>
      <Text style={styles.reviewVal}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 24, gap: 14, paddingBottom: 60 },
  h1: { color: '#fff', fontSize: 28, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 13 },
  progressOuter: { height: 6, backgroundColor: '#1f2937', borderRadius: 3, overflow: 'hidden' },
  progressInner: { height: '100%', backgroundColor: '#7cf0a1' },
  label: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subLabel: { color: '#9ca3af', fontSize: 12, marginBottom: 6 },
  hint: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: '#11161f',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 17,
  },
  choice: {
    backgroundColor: '#11161f',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  choiceSelected: { backgroundColor: '#7cf0a1', borderColor: '#7cf0a1' },
  choiceLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  choiceLabelSelected: { color: '#0b0f17' },
  choiceDesc: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: '#1f2937' },
  btnGhostText: { color: '#d1d5db', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#7cf0a1' },
  btnPrimaryText: { color: '#0b0f17', fontWeight: '800' },
  reviewCard: { backgroundColor: '#11161f', borderRadius: 12, padding: 16, borderColor: '#1f2937', borderWidth: 1 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomColor: '#1f2937', borderBottomWidth: 1 },
  reviewKey: { color: '#9ca3af', fontSize: 14 },
  reviewVal: { color: '#7cf0a1', fontSize: 16, fontWeight: '700' },
});
