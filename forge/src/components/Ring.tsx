import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/theme/colors';

interface RingProps {
  size?: number;
  stroke?: number;
  progress: number; // 0-1
  color?: string;
  bgColor?: string;
  label?: string;
  centerText?: string;
  centerSub?: string;
}

export function Ring({
  size = 80,
  stroke = 8,
  progress,
  color = colors.accent,
  bgColor = colors.border,
  label,
  centerText,
  centerSub,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={bgColor}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        {(centerText || centerSub) && (
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            {centerText && <Text style={{ color: colors.text, fontWeight: '700', fontSize: size / 5 }}>{centerText}</Text>}
            {centerSub && <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>{centerSub}</Text>}
          </View>
        )}
      </View>
      {label && <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 6, fontWeight: '600' }}>{label}</Text>}
    </View>
  );
}
