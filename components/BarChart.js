// Single-series bar chart built from plain Views (no chart library).
//
// One series per chart, always: the app's series colours are only safe apart,
// because purple and blue collapse into each other for red-green colourblind
// readers. The title names the series, so there is no legend box.
//
// Marks: 4px rounded tops sitting on the baseline, 2px gaps, an optional goal
// line or target band, and a day that was not logged drawn as a short grey
// tick so "no data" never reads as "zero". Tap a bar to read its value.

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const INK = '#ffffff';
const INK_MUTED = '#9ca3af';
const INK_FAINT = '#6b7280';
const GRID = '#1f2937';

export default function BarChart({
  title,
  data,                // [{ date, value (number | null), goal? }]
  color,
  unit = '',
  height = 120,
  goalKey = 'goal',    // per-bar goal field; drawn as a line at its latest value
  band = null,         // { min, max, label } shaded target range
  formatLabel = (d) => d.date.slice(5),
  formatValue = (v) => `${Math.round(v)}${unit}`,
  emptyText = 'Nothing logged yet',
}) {
  const [selected, setSelected] = useState(null);
  const values = data.map((d) => d.value).filter((v) => v !== null && v !== undefined);
  const goal = [...data].reverse().find((d) => d[goalKey])?.[goalKey] ?? null;
  const top = Math.max(1, ...values, goal || 0, band ? band.max : 0) * 1.1;
  const y = (v) => (v / top) * height;
  const pick = selected !== null ? data[selected] : null;

  const summary = values.length
    ? `${title}: ${values.length} of ${data.length} days logged, average ${formatValue(values.reduce((a, b) => a + b, 0) / values.length)}`
    : `${title}: ${emptyText}`;

  let readout = '';
  if (pick) {
    const has = pick.value !== null && pick.value !== undefined;
    readout = `${formatLabel(pick)}: ${has ? formatValue(pick.value) : 'not logged'}`;
  } else if (goal) {
    readout = `Goal ${formatValue(goal)}`;
  } else if (band) {
    readout = band.label;
  }

  return (
    <View style={styles.card} accessible accessibilityLabel={summary}>
      <View style={styles.headRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.readout}>{readout}</Text>
      </View>

      {values.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        <View style={{ height, marginTop: 8 }}>
          {band && (
            <View
              style={[styles.band, { bottom: y(band.min), height: y(band.max) - y(band.min) }]}
              pointerEvents="none"
            />
          )}
          <View style={styles.bars}>
            {data.map((d, i) => {
              const has = d.value !== null && d.value !== undefined;
              return (
                <Pressable
                  key={d.date + i}
                  onPress={() => setSelected(selected === i ? null : i)}
                  style={styles.hit}
                  accessibilityLabel={`${formatLabel(d)}: ${has ? formatValue(d.value) : 'not logged'}`}
                >
                  {has ? (
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(2, y(d.value)), backgroundColor: color },
                        selected !== null && selected !== i && styles.dim,
                      ]}
                    />
                  ) : (
                    <View style={styles.missing} />
                  )}
                </Pressable>
              );
            })}
          </View>
          {goal ? <View style={[styles.goalLine, { bottom: y(goal) }]} pointerEvents="none" /> : null}
        </View>
      )}

      {values.length > 0 && (
        <View style={styles.axisRow}>
          <Text style={styles.axis}>{formatLabel(data[0])}</Text>
          <Text style={styles.axis}>{formatLabel(data[data.length - 1])}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#11161f', borderRadius: 14, borderWidth: 1, borderColor: GRID, padding: 14 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  title: { color: INK, fontSize: 14, fontWeight: '700' },
  readout: { color: INK_MUTED, fontSize: 12, flexShrink: 1, textAlign: 'right' },
  empty: { color: INK_FAINT, fontSize: 12, fontStyle: 'italic', paddingVertical: 24, textAlign: 'center' },
  bars: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
    flexDirection: 'row', alignItems: 'flex-end', gap: 2,
  },
  // The whole column is the tap target, bigger than the bar itself.
  hit: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  dim: { opacity: 0.35 },
  missing: { height: 2, backgroundColor: '#374151', marginHorizontal: 2 },
  goalLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: INK_MUTED, opacity: 0.8 },
  band: { position: 'absolute', left: 0, right: 0, backgroundColor: '#ffffff', opacity: 0.06 },
  axisRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6,
    borderTopWidth: 1, borderTopColor: GRID, paddingTop: 4,
  },
  axis: { color: INK_FAINT, fontSize: 10 },
});
