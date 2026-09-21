import { View, Text, StyleSheet } from 'react-native';

export default function MacroBar({ label, current, goal, color, unit = 'g' }) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{Math.round(current)}</Text>
          <Text style={{ color: '#6b7280' }}> / {goal}{unit}</Text>
        </Text>
      </View>
      <View style={styles.barOuter}>
        <View style={[styles.barInner, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#d1d5db', fontSize: 13, fontWeight: '600' },
  values: { fontSize: 13 },
  barOuter: { height: 8, backgroundColor: '#1f2937', borderRadius: 4, overflow: 'hidden' },
  barInner: { height: '100%', borderRadius: 4 },
});
