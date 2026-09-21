import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Button } from '@/components/Card';
import { colors, radius, spacing } from '@/theme/colors';
import { curateProfile } from '@/services/dietCalculator';
import { useGameStore, BodyType, Experience, Goal } from '@/store/gameStore';

type Step = 'basics' | 'body' | 'goal' | 'training' | 'diet';
const ORDER: Step[] = ['basics', 'body', 'goal', 'training', 'diet'];

export default function OnboardingQuiz({ navigation }: any) {
  const [step, setStep] = useState<Step>('basics');
  const setProfile = useGameStore(s => s.setProfile);

  const [name, setName] = useState('Arjun');
  const [age, setAge] = useState('24');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [heightCm, setHeightCm] = useState('178');
  const [weightKg, setWeightKg] = useState('72');
  const [bodyType, setBodyType] = useState<BodyType>('skinny-fat');
  const [experience, setExperience] = useState<Experience>('beginner');
  const [goal, setGoal] = useState<Goal>('recomp');
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState(3);
  const [restrictions, setRestrictions] = useState<string[]>([]);

  const next = () => {
    const i = ORDER.indexOf(step);
    if (i < ORDER.length - 1) setStep(ORDER[i + 1]);
    else finish();
  };

  const finish = () => {
    const profile = curateProfile({
      name,
      age: parseInt(age) || 24,
      sex,
      heightCm: parseInt(heightCm) || 178,
      weightKg: parseFloat(weightKg) || 72,
      bodyType,
      experience,
      goal,
      workoutsPerWeek,
      dietaryRestrictions: restrictions,
    });
    setProfile(profile);
    navigation.replace('Plan');
  };

  const progress = ((ORDER.indexOf(step) + 1) / ORDER.length) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        {step === 'basics' && (
          <>
            <H>The basics</H>
            <Sub>We use these for accurate calorie math (Mifflin-St Jeor).</Sub>
            <Field label="Name">
              <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={colors.textMuted} />
            </Field>
            <Row>
              <Field label="Age" flex>
                <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={styles.input} />
              </Field>
              <Field label="Sex" flex>
                <Pills value={sex} options={[{v:'male',l:'Male'},{v:'female',l:'Female'}]} onSelect={(v: any) => setSex(v)} />
              </Field>
            </Row>
            <Row>
              <Field label="Height (cm)" flex>
                <TextInput value={heightCm} onChangeText={setHeightCm} keyboardType="number-pad" style={styles.input} />
              </Field>
              <Field label="Weight (kg)" flex>
                <TextInput value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" style={styles.input} />
              </Field>
            </Row>
          </>
        )}

        {step === 'body' && (
          <>
            <H>What's your body type?</H>
            <Sub>Be honest. This shapes your whole plan.</Sub>
            <Choice
              value={bodyType}
              onSelect={(v: any) => setBodyType(v)}
              options={[
                { v: 'skinny', l: 'Skinny', d: 'Low body fat, low muscle. Need to gain.' },
                { v: 'skinny-fat', l: 'Skinny-Fat', d: 'Thin limbs but soft midsection. Need to recomp.' },
                { v: 'average', l: 'Average', d: 'Healthy weight, some muscle definition.' },
                { v: 'overweight', l: 'Overweight', d: 'Higher body fat, want to lean out.' },
                { v: 'muscular', l: 'Muscular', d: 'Already built, optimizing.' },
              ]}
            />
          </>
        )}

        {step === 'goal' && (
          <>
            <H>Your primary goal?</H>
            <Sub>You can change this later.</Sub>
            <Choice
              value={goal}
              onSelect={(v: any) => setGoal(v)}
              options={[
                { v: 'recomp', l: 'Recomp', d: 'Build muscle while losing fat. Best for skinny-fat.' },
                { v: 'cut', l: 'Cut', d: 'Strip body fat. Aggressive deficit.' },
                { v: 'bulk', l: 'Bulk', d: 'Pack on muscle. Lean surplus.' },
                { v: 'maintain', l: 'Maintain', d: 'Hold current physique, dial in health.' },
              ]}
            />
          </>
        )}

        {step === 'training' && (
          <>
            <H>Training</H>
            <Sub>How many days a week can you realistically lift?</Sub>
            <Pills
              value={workoutsPerWeek}
              options={[1,2,3,4,5,6,7].map(n => ({ v: n, l: String(n) }))}
              onSelect={(v: any) => setWorkoutsPerWeek(v)}
              style={{ marginBottom: spacing.lg }}
            />
            <Sub style={{ marginTop: 0 }}>Experience level</Sub>
            <Choice
              value={experience}
              onSelect={(v: any) => setExperience(v)}
              options={[
                { v: 'beginner', l: 'Beginner', d: '<1 year lifting consistently' },
                { v: 'intermediate', l: 'Intermediate', d: '1-3 years, know the lifts' },
                { v: 'advanced', l: 'Advanced', d: '3+ years, programmed training' },
              ]}
            />
          </>
        )}

        {step === 'diet' && (
          <>
            <H>Diet restrictions</H>
            <Sub>Tap any that apply. We'll filter food recommendations.</Sub>
            <MultiChoice
              values={restrictions}
              onToggle={(v) => {
                if (restrictions.includes(v)) setRestrictions(restrictions.filter(x => x !== v));
                else setRestrictions([...restrictions, v]);
              }}
              options={[
                { v: 'vegetarian', l: 'Vegetarian' },
                { v: 'vegan', l: 'Vegan' },
                { v: 'gluten-free', l: 'Gluten-free' },
                { v: 'dairy-free', l: 'Dairy-free' },
                { v: 'halal', l: 'Halal' },
                { v: 'kosher', l: 'Kosher' },
                { v: 'nut-allergy', l: 'Nut allergy' },
                { v: 'none', l: 'None' },
              ]}
            />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={step === 'diet' ? 'Build my plan' : 'Continue'} onPress={next} />
      </View>
    </View>
  );
}

// --- helpers ---

const H = ({ children }: any) => <Text style={styles.h}>{children}</Text>;
const Sub = ({ children, style }: any) => <Text style={[styles.sub, style]}>{children}</Text>;
const Row = ({ children }: any) => <View style={{ flexDirection: 'row', gap: spacing.md }}>{children}</View>;
const Field = ({ label, children, flex }: any) => (
  <View style={{ marginBottom: spacing.md, flex: flex ? 1 : undefined }}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

function Pills({ value, options, onSelect, style }: any) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, style]}>
      {options.map((o: any) => (
        <TouchableOpacity
          key={o.v}
          onPress={() => onSelect(o.v)}
          style={[styles.pill, value === o.v && styles.pillActive]}
        >
          <Text style={[styles.pillText, value === o.v && styles.pillTextActive]}>{o.l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Choice({ value, options, onSelect }: any) {
  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((o: any) => (
        <TouchableOpacity
          key={o.v}
          onPress={() => onSelect(o.v)}
          style={[styles.choice, value === o.v && styles.choiceActive]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.choiceL, value === o.v && { color: colors.accent }]}>{o.l}</Text>
            <Text style={styles.choiceD}>{o.d}</Text>
          </View>
          <View style={[styles.radio, value === o.v && styles.radioActive]} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MultiChoice({ values, options, onToggle }: any) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map((o: any) => {
        const on = values.includes(o.v);
        return (
          <TouchableOpacity
            key={o.v}
            onPress={() => onToggle(o.v)}
            style={[styles.pill, on && styles.pillActive]}
          >
            <Text style={[styles.pillText, on && styles.pillTextActive]}>{o.l}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 3, backgroundColor: colors.border },
  progressFill: { height: 3, backgroundColor: colors.accent },
  h: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: spacing.md },
  sub: { color: colors.textDim, fontSize: 14, marginTop: spacing.sm, marginBottom: spacing.lg, lineHeight: 20 },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  pillActive: { backgroundColor: colors.accentGlow, borderColor: colors.accent },
  pillText: { color: colors.textDim, fontWeight: '600', fontSize: 14 },
  pillTextActive: { color: colors.accent },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  choiceActive: { borderColor: colors.accent, backgroundColor: colors.accentGlow },
  choiceL: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 },
  choiceD: { color: colors.textMuted, fontSize: 13 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderColor: colors.border, borderWidth: 2,
  },
  radioActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopColor: colors.border, borderTopWidth: 1,
  },
});
