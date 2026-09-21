import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../lib/store';
import { generateDietPlan } from '../../lib/dietGenerator';
import ApiKeyGate from '../../components/ApiKeyGate';

export default function Diet() {
  const profile = useStore((s) => s.profile);
  const goals = useStore((s) => s.goals);
  const dietPlan = useStore((s) => s.dietPlan);
  const setDietPlan = useStore((s) => s.setDietPlan);
  const apiKey = useStore((s) => s.apiKey);

  const [generating, setGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const plan = await generateDietPlan({ profile, goals, apiKey });
      setDietPlan(plan);
      Alert.alert('Plan ready!', 'Tap any day to expand the meals.');
    } catch (e) {
      Alert.alert('Generation failed', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const onClear = () => {
    Alert.alert('Clear plan?', 'This deletes your saved diet plan.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setDietPlan(null) },
    ]);
  };

  if (!apiKey) {
    return <ApiKeyGate feature="The AI diet planner" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>AI Diet Plan</Text>
        <Text style={styles.sub}>
          Personalized to your profile + macro targets. Costs ~$0.05 per generation.
        </Text>

        {/* Profile summary */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Generating for:</Text>
          <Text style={styles.profileLine}>
            {profile.age}yo {profile.sex} · {Math.round((profile.weightKg || 0) * 2.2046)} lb · Goal: {profile.goal}
          </Text>
          <Text style={styles.profileLine}>
            Targets: {goals.calories} kcal · {goals.protein}g P · {goals.carbs}g C · {goals.fat}g F
          </Text>
          {!!profile.dietPreferences && (
            <Text style={styles.profilePref}>"{profile.dietPreferences}"</Text>
          )}
        </View>

        {!dietPlan ? (
          <Pressable onPress={onGenerate} style={styles.genBtn} disabled={generating}>
            {generating ? (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <ActivityIndicator color="#0b0f17" />
                <Text style={styles.genText}>Cooking up your plan…</Text>
              </View>
            ) : (
              <Text style={styles.genText}>🥗 Generate 7-Day Plan</Text>
            )}
          </Pressable>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>STRATEGY</Text>
              <Text style={styles.summaryText}>{dietPlan.summary}</Text>
            </View>

            {dietPlan.days?.map((day, i) => {
              const open = expandedDay === i;
              return (
                <View key={i} style={styles.dayCard}>
                  <Pressable onPress={() => setExpandedDay(open ? null : i)} style={styles.dayHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dayName}>{day.day}</Text>
                      <Text style={styles.dayMacros}>
                        {day.totals?.calories} kcal · {day.totals?.protein_g}g P · {day.totals?.carbs_g}g C · {day.totals?.fat_g}g F
                      </Text>
                    </View>
                    <Text style={styles.expand}>{open ? '▾' : '▸'}</Text>
                  </Pressable>
                  {open && day.meals?.map((meal, j) => (
                    <View key={j} style={styles.mealCard}>
                      <Text style={styles.mealHeader}>
                        {mealEmoji(meal.meal)} {meal.meal?.toUpperCase()} — {meal.name}
                      </Text>
                      {meal.ingredients?.map((ing, k) => (
                        <Text key={k} style={styles.ingredient}>· {ing}</Text>
                      ))}
                      <Text style={styles.mealMacros}>
                        {meal.macros?.calories} kcal · {meal.macros?.protein_g}g P · {meal.macros?.carbs_g}g C · {meal.macros?.fat_g}g F
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}

            {dietPlan.shoppingList?.length > 0 && (
              <View style={styles.listCard}>
                <Text style={styles.summaryLabel}>SHOPPING LIST</Text>
                {dietPlan.shoppingList.map((item, i) => (
                  <Text key={i} style={styles.listItem}>· {item}</Text>
                ))}
              </View>
            )}

            {dietPlan.tips?.length > 0 && (
              <View style={styles.listCard}>
                <Text style={styles.summaryLabel}>TIPS</Text>
                {dietPlan.tips.map((t, i) => (
                  <Text key={i} style={styles.listItem}>• {t}</Text>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={onClear} style={[styles.btn, styles.btnGhost]}>
                <Text style={styles.btnGhostText}>Delete plan</Text>
              </Pressable>
              <Pressable onPress={onGenerate} style={[styles.btn, styles.btnPrimary]} disabled={generating}>
                <Text style={styles.btnPrimaryText}>{generating ? '…' : 'Regenerate'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function mealEmoji(m) {
  return { breakfast: '🌅', lunch: '🌞', dinner: '🌙', snack: '🍿' }[m] || '🍽️';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 14, paddingBottom: 60 },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 13 },
  profileCard: { backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1, borderRadius: 12, padding: 14 },
  profileTitle: { color: '#7cf0a1', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  profileLine: { color: '#fff', fontSize: 13, marginBottom: 4 },
  profilePref: { color: '#9ca3af', fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  genBtn: {
    backgroundColor: '#7cf0a1', paddingVertical: 22, borderRadius: 14, alignItems: 'center',
  },
  genText: { color: '#0b0f17', fontWeight: '800', fontSize: 16 },
  summaryCard: { backgroundColor: '#11161f', borderColor: '#7cf0a1', borderWidth: 1, borderRadius: 12, padding: 14 },
  summaryLabel: { color: '#7cf0a1', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  summaryText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  dayCard: { backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  dayName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dayMacros: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  expand: { color: '#7cf0a1', fontSize: 18, fontWeight: '800' },
  mealCard: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopColor: '#1f2937', borderTopWidth: 1,
  },
  mealHeader: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  ingredient: { color: '#d1d5db', fontSize: 13, paddingLeft: 8, paddingVertical: 1 },
  mealMacros: { color: '#7cf0a1', fontSize: 11, fontWeight: '700', marginTop: 6 },
  listCard: { backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1, borderRadius: 12, padding: 14 },
  listItem: { color: '#fff', fontSize: 13, paddingVertical: 3 },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnGhost: { backgroundColor: '#1f2937' },
  btnGhostText: { color: '#d1d5db', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#7cf0a1' },
  btnPrimaryText: { color: '#0b0f17', fontWeight: '800' },
  warn: { padding: 30 },
  warnText: { color: '#fbbf24', fontSize: 14 },
});
