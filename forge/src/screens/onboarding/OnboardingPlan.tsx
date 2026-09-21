import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from '@/components/Card';
import { Ring } from '@/components/Ring';
import { colors, radius, spacing } from '@/theme/colors';
import { useGameStore } from '@/store/gameStore';
import { dietRecommendations } from '@/services/dietCalculator';

export default function OnboardingPlan() {
  const profile = useGameStore(s => s.profile);
  const completeOnboarding = useGameStore(s => s.completeOnboarding);

  if (!profile) return null;

  const recs = dietRecommendations(profile);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text style={styles.label}>YOUR PROFILE</Text>
        <Text style={styles.h}>{profile.name}, here's your plan.</Text>
        <Text style={styles.sub}>
          Based on Mifflin-St Jeor BMR, your TDEE, your {profile.bodyType} body type, and your {profile.goal} goal.
        </Text>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.cardLabel}>DAILY TARGETS</Text>
          <View style={styles.macros}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={styles.macroVal}>{profile.targetCalories}</Text>
              <Text style={styles.macroL}>kcal</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[styles.macroVal, { color: colors.protein }]}>{profile.targetProteinG}g</Text>
              <Text style={styles.macroL}>protein</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[styles.macroVal, { color: colors.carbs }]}>{profile.targetCarbsG}g</Text>
              <Text style={styles.macroL}>carbs</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[styles.macroVal, { color: colors.fat }]}>{profile.targetFatG}g</Text>
              <Text style={styles.macroL}>fat</Text>
            </View>
          </View>
        </Card>

        <Text style={[styles.label, { marginTop: spacing.lg }]}>RECOMMENDATIONS</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {recs.map((r, i) => (
            <Card key={i}>
              <Text style={styles.rec}>{r}</Text>
            </Card>
          ))}
        </View>

        <Card style={{ marginTop: spacing.md, padding: spacing.md }}>
          <Text style={styles.cardLabel}>YOUR STARTING STATS</Text>
          <Row k="Body Type" v={profile.bodyType} />
          <Row k="Experience" v={profile.experience} />
          <Row k="Goal" v={profile.goal} />
          <Row k="Training" v={`${profile.workoutsPerWeek} days/week`} />
          <Row k="Activity factor" v={profile.activityLevel.toFixed(2)} last />
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Let's go" onPress={completeOnboarding} />
      </View>
    </View>
  );
}

const Row = ({ k, v, last }: any) => (
  <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
    <Text style={styles.rowK}>{k}</Text>
    <Text style={styles.rowV}>{v}</Text>
  </View>
);

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1.4 },
  h: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: spacing.sm },
  sub: { color: colors.textDim, fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  cardLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1.4, marginBottom: spacing.md },
  macros: { flexDirection: 'row', justifyContent: 'space-between' },
  macroVal: { color: colors.text, fontSize: 22, fontWeight: '700' },
  macroL: { color: colors.textMuted, fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  rec: { color: colors.text, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowK: { color: colors.textDim, fontSize: 14 },
  rowV: { color: colors.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopColor: colors.border, borderTopWidth: 1,
  },
});
