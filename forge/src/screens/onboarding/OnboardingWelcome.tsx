import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/Card';
import { colors, spacing } from '@/theme/colors';

export default function OnboardingWelcome({ navigation }: any) {
  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient
        colors={[colors.accent, 'transparent']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />
      <View style={styles.content}>
        <Text style={styles.logo}>◌  FORGE</Text>
        <Text style={styles.tagline}>Build the body. Build the discipline. Build the life.</Text>
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <Bullet text="AI-curated diet from a 30-second quiz" />
          <Bullet text="2.8M+ food database + photo macros" />
          <Bullet text="Workout builder with XP and levels" />
          <Bullet text="Lock distracting apps until you earn them" />
          <Bullet text="Outfit, physique, posture analysis" />
        </View>
      </View>
      <View style={{ padding: spacing.lg }}>
        <Button label="Start" onPress={() => navigation.navigate('Quiz')} />
        <Text style={styles.fineprint}>Takes 2 minutes. We'll curate your macros and a starter plan.</Text>
      </View>
    </SafeAreaView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
      <View style={styles.dot} />
      <Text style={styles.bullet}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 400, opacity: 0.15 },
  content: { padding: spacing.lg, paddingTop: spacing.xxl, flex: 1 },
  logo: { color: colors.text, fontSize: 36, fontWeight: '800', letterSpacing: 4, marginTop: spacing.xl },
  tagline: { color: colors.textDim, fontSize: 17, marginTop: spacing.md, lineHeight: 24 },
  bullet: { color: colors.text, fontSize: 15, flex: 1, lineHeight: 22 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 9 },
  fineprint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.sm },
});
