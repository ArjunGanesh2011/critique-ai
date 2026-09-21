import { View, Text, StyleSheet } from 'react-native';

export default function CharacterCard({ tier, xp, progress, xpIntoLevel, xpForNext, streak }) {
  return (
    <View style={[styles.card, { borderColor: tier.current.color + '55' }]}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{tier.current.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.tierLabel}>LVL {tier.current.level}</Text>
          <Text style={[styles.tierTitle, { color: tier.current.color }]}>{tier.current.title}</Text>
        </View>
        <View style={styles.streakBox}>
          <Text style={styles.streakNum}>{streak}</Text>
          <Text style={styles.streakLabel}>🔥 day{streak === 1 ? '' : 's'}</Text>
        </View>
      </View>

      <View style={styles.xpBarOuter}>
        <View
          style={[
            styles.xpBarInner,
            { width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: tier.current.color },
          ]}
        />
      </View>
      <Text style={styles.xpText}>
        {tier.next
          ? `${xpIntoLevel} / ${xpForNext} XP to ${tier.next.title}`
          : `${xp} XP — MAX TIER`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#11161f',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emoji: { fontSize: 56 },
  tierLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  tierTitle: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  streakBox: { alignItems: 'center' },
  streakNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  streakLabel: { color: '#9ca3af', fontSize: 11 },
  xpBarOuter: {
    height: 10,
    backgroundColor: '#1f2937',
    borderRadius: 6,
    marginTop: 16,
    overflow: 'hidden',
  },
  xpBarInner: { height: '100%', borderRadius: 6 },
  xpText: { color: '#9ca3af', fontSize: 12, marginTop: 8, textAlign: 'right' },
});
