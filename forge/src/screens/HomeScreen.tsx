import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, FeatureCard, Section } from '@/components/Card';
import { Ring } from '@/components/Ring';
import { colors, radius, spacing } from '@/theme/colors';
import { useGameStore, progressInLevel } from '@/store/gameStore';

export default function HomeScreen({ navigation }: any) {
  const profile = useGameStore(s => s.profile);
  const xp = useGameStore(s => s.xp);
  const level = useGameStore(s => s.level);
  const streak = useGameStore(s => s.streak);
  const todaysFood = useGameStore(s => s.todaysFood);
  const dailyQuests = useGameStore(s => s.dailyQuests);
  const completeQuest = useGameStore(s => s.completeQuest);

  const kcal = todaysFood.reduce((s, f) => s + f.calories, 0);
  const protein = todaysFood.reduce((s, f) => s + f.proteinG, 0);
  const carbs = todaysFood.reduce((s, f) => s + f.carbsG, 0);
  const fat = todaysFood.reduce((s, f) => s + f.fatG, 0);

  const target = profile?.targetCalories || 2200;
  const targetP = profile?.targetProteinG || 150;

  const lvlInfo = progressInLevel(xp);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.greeting}>Hey, {profile?.name?.split(' ')[0]}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <View style={styles.avatar}><Text style={{ color: '#fff', fontWeight: '800' }}>{profile?.name?.[0]}</Text></View>
          </TouchableOpacity>
        </View>

        {/* XP / Level Card */}
        <Card style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Ring
              size={70}
              stroke={6}
              progress={lvlInfo.pct}
              centerText={String(level)}
              centerSub="LVL"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>RANK</Text>
              <Text style={styles.cardH}>{xpTitle(level)}</Text>
              <Text style={styles.cardSub}>
                {lvlInfo.current} / {lvlInfo.span} XP to lvl {level + 1}
              </Text>
            </View>
            <View style={styles.streakBox}>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLabel}>STREAK</Text>
            </View>
          </View>
        </Card>

        {/* Macros today */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
            <View>
              <Text style={styles.cardLabel}>TODAY'S NUTRITION</Text>
              <Text style={styles.cardH}>{Math.round(kcal)} / {target} kcal</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'Nutrition' })}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Log →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.macroRow}>
            <Ring size={60} stroke={6} progress={kcal / target} color={colors.accent} label="Calories" />
            <Ring size={60} stroke={6} progress={protein / targetP} color={colors.protein} label={`${Math.round(protein)}g P`} />
            <Ring size={60} stroke={6} progress={carbs / (profile?.targetCarbsG || 250)} color={colors.carbs} label={`${Math.round(carbs)}g C`} />
            <Ring size={60} stroke={6} progress={fat / (profile?.targetFatG || 70)} color={colors.fat} label={`${Math.round(fat)}g F`} />
          </View>
        </Card>

        {/* Daily quests */}
        <Section label="DAILY QUESTS" style={{ marginTop: spacing.lg }}>
          {dailyQuests.map(q => (
            <TouchableOpacity
              key={q.id}
              activeOpacity={0.7}
              onPress={() => !q.completed && completeQuest(q.id)}
              style={[styles.quest, q.completed && styles.questDone]}
            >
              <View style={[styles.questCheck, q.completed && styles.questCheckOn]}>
                {q.completed && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.questT, q.completed && { textDecorationLine: 'line-through', color: colors.textMuted }]}>{q.title}</Text>
                <Text style={styles.questD}>{q.desc}</Text>
              </View>
              <Text style={styles.xpBadge}>+{q.xp} XP</Text>
            </TouchableOpacity>
          ))}
        </Section>

        {/* Feature grid */}
        <Section label="ALL FEATURES" style={{ marginTop: spacing.lg }}>
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <FeatureCard icon="🍴" title="Nutrition Scanner" subtitle="Snap a photo for instant macros." onPress={() => navigation.navigate('PhotoMacro')} />
              <FeatureCard icon="◉" title="Outfit Rating" subtitle="AI feedback on fit and color." onPress={() => navigation.navigate('Outfit')} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <FeatureCard icon="◐" title="Physique Scan" subtitle="Composition + weak points." onPress={() => navigation.navigate('Physique')} />
              <FeatureCard icon="↕" title="Posture Analysis" subtitle="Side-profile corrections." onPress={() => navigation.navigate('Posture')} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <FeatureCard icon="◈" title="Workout System" subtitle="Build, log, level up." onPress={() => navigation.navigate('Tabs', { screen: 'Workout' })} />
              <FeatureCard icon="≈" title="Breathing" subtitle="Box, 4-7-8, Wim Hof." onPress={() => navigation.navigate('Breathing')} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <FeatureCard icon="▲" title="Rankings" subtitle="Level 1 → 10 progression." onPress={() => navigation.navigate('Rankings')} />
              <FeatureCard icon="◊" title="Focus Lock" subtitle="Earn social media with reps." onPress={() => navigation.navigate('AppBlocker')} />
            </View>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function xpTitle(level: number) {
  const titles = ['Novice', 'Initiate', 'Adept', 'Disciple', 'Striver', 'Forger', 'Ascendant', 'Vanguard', 'Sovereign', 'Apex'];
  return titles[Math.min(level - 1, titles.length - 1)];
}

const styles = StyleSheet.create({
  greeting: { color: colors.text, fontSize: 24, fontWeight: '700' },
  date: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },
  cardH: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 2 },
  cardSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  streakBox: { alignItems: 'center' },
  streakNum: { color: colors.warning, fontSize: 22, fontWeight: '800' },
  streakLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 1 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  questDone: { opacity: 0.5 },
  questCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  questCheckOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  questT: { color: colors.text, fontWeight: '600', fontSize: 14 },
  questD: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  xpBadge: {
    color: colors.accent, fontWeight: '700', fontSize: 12,
    backgroundColor: colors.accentGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill,
  },
});
