import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/theme/colors';

interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function FeatureCard({ icon, title, subtitle, onPress, style }: FeatureCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.feature, style]}
    >
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  return <View style={[styles.card, padded && { padding: spacing.md }, style]}>{children}</View>;
}

interface SectionProps {
  label?: string;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Section({ label, title, children, style }: SectionProps) {
  return (
    <View style={[{ marginBottom: spacing.lg }, style]}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[
        styles.btnLabel,
        variant === 'secondary' && { color: colors.text },
        variant === 'ghost' && { color: colors.textDim },
      ]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  feature: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flex: 1,
    minHeight: 130,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: { fontSize: 22, marginBottom: spacing.sm, color: colors.textDim },
  featureTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  featureSub: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  btn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.accent },
  btnSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnGhost: { backgroundColor: 'transparent' },
  btnLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
