// Single-series line chart built from plain Views, the line-shaped sibling
// of BarChart for values that change slowly over time, like body weight.
//
// Bars have to start at zero, which would flatten a 0.4 lb change into
// nothing. A line can zoom in, so this one scales to the data's own range and
// labels the top and bottom of that range, so the zoom is never hidden.
//
// Points sit at their real dates, so a gap in weigh-ins shows as a gap.
// Segments are thin rotated Views (2px), points are 8px dots with a ring in
// the card colour so overlapping points stay distinct. Tap a point to read it.

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { daysBetween } from '../lib/dates';

const INK = '#ffffff';
const INK_MUTED = '#9ca3af';
const INK_FAINT = '#6b7280';
const GRID = '#1f2937';
const SURFACE = '#11161f';
const DOT = 8;

export default function LineChart({
  title,
  data,                 // [{ date: 'YYYY-MM-DD', value }], oldest first
  color,
  unit = '',
  height = 110,
  bare = false,         // drop the card chrome when embedded in another card
  defaultReadout = '',
  formatLabel = (d) => d.date.slice(5),
  formatValue = (v) => `${v}${unit}`,
  // Horizontal space around the plot (screen padding, card padding, y-axis
  // labels). Used only for the first-paint estimate below.
  inset = 120,
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [measured, setMeasured] = useState(0);
  // Draw straight away from an estimate, then snap to the real width once
  // layout reports it. Waiting for layout alone can leave the chart blank.
  const width = measured || Math.max(0, windowWidth - inset);
  const [selected, setSelected] = useState(null);
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // Pad the range so a flat line sits mid-chart instead of on an edge.
  const pad = Math.max(0.5, (hi - lo) * 0.15);
  const yMin = lo - pad;
  const yMax = hi + pad;
  const span = Math.max(1, daysBetween(data[0].date, data[data.length - 1].date));

  const inner = Math.max(0, width - DOT);
  const pts = data.map((d) => ({
    x: DOT / 2 + (data.length === 1 ? inner / 2 : (daysBetween(data[0].date, d.date) / span) * inner),
    y: DOT / 2 + (1 - (d.value - yMin) / (yMax - yMin)) * (height - DOT),
  }));

  const pick = selected !== null ? data[selected] : null;
  const readout = pick ? `${formatLabel(pick)}: ${formatValue(pick.value)}` : defaultReadout;
  const first = data[0];
  const last = data[data.length - 1];
  const summary = `${title}: ${data.length} readings, from ${formatValue(first.value)} on ${formatLabel(first)} to ${formatValue(last.value)} on ${formatLabel(last)}`;

  return (
    <View style={bare ? styles.bare : styles.card} accessible accessibilityLabel={summary}>
      <View style={styles.headRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.readout}>{readout}</Text>
      </View>

      <View style={styles.plotRow}>
        <View style={{ flex: 1, height }} onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}>
          {width > 0 && (
            <>
              <View style={[styles.gridLine, { top: DOT / 2 }]} />
              <View style={[styles.gridLine, { top: height - DOT / 2 }]} />
              {pts.slice(1).map((p, i) => {
                const a = pts[i];
                const dx = p.x - a.x;
                const dy = p.y - a.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                return (
                  <View
                    key={`s${i}`}
                    pointerEvents="none"
                    style={[
                      styles.segment,
                      {
                        backgroundColor: color,
                        width: len,
                        left: (a.x + p.x) / 2 - len / 2,
                        top: (a.y + p.y) / 2 - 1,
                        transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                      },
                    ]}
                  />
                );
              })}
              {pts.map((p, i) => (
                <View
                  key={`d${i}`}
                  pointerEvents="none"
                  style={[
                    styles.dot,
                    { left: p.x - DOT / 2, top: p.y - DOT / 2, backgroundColor: color },
                    selected === i && styles.dotSelected,
                  ]}
                />
              ))}
              {/* Tap targets: a full-height column around each point. */}
              {pts.map((p, i) => {
                const prev = i === 0 ? 0 : (pts[i - 1].x + p.x) / 2;
                const next = i === pts.length - 1 ? width : (p.x + pts[i + 1].x) / 2;
                return (
                  <Pressable
                    key={`h${i}`}
                    onPress={() => setSelected(selected === i ? null : i)}
                    accessibilityLabel={`${formatLabel(data[i])}: ${formatValue(data[i].value)}`}
                    style={[styles.hit, { left: prev, width: Math.max(12, next - prev), height }]}
                  />
                );
              })}
            </>
          )}
        </View>
        <View style={[styles.yAxis, { height }]}>
          <Text style={styles.axis}>{formatValue(Math.round(yMax * 10) / 10)}</Text>
          <Text style={styles.axis}>{formatValue(Math.round(yMin * 10) / 10)}</Text>
        </View>
      </View>

      <View style={styles.axisRow}>
        <Text style={styles.axis}>{formatLabel(first)}</Text>
        <Text style={styles.axis}>{formatLabel(last)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: GRID, padding: 14 },
  bare: { paddingTop: 4 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  title: { color: INK, fontSize: 14, fontWeight: '700' },
  readout: { color: INK_MUTED, fontSize: 12, flexShrink: 1, textAlign: 'right' },
  plotRow: { flexDirection: 'row', gap: 8 },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: GRID },
  segment: { position: 'absolute', height: 2, borderRadius: 1 },
  dot: {
    position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2,
    borderWidth: 2, borderColor: SURFACE,
  },
  dotSelected: { borderColor: INK },
  hit: { position: 'absolute', top: 0 },
  yAxis: { justifyContent: 'space-between' },
  axisRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6,
    borderTopWidth: 1, borderTopColor: GRID, paddingTop: 4,
  },
  axis: { color: INK_FAINT, fontSize: 10 },
});
