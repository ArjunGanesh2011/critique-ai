// Forge dark theme — matches the Critique AI aesthetic you screenshot'd
export const colors = {
  bg: '#0A0A0F',
  bgElevated: '#15151E',
  card: '#1A1A24',
  cardHover: '#22222E',
  border: '#2A2A38',
  text: '#FFFFFF',
  textDim: '#A0A0B0',
  textMuted: '#6B6B7A',
  accent: '#6366F1', // indigo-500
  accentDim: '#4F46E5',
  accentGlow: 'rgba(99, 102, 241, 0.15)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  protein: '#EF4444',
  carbs: '#F59E0B',
  fat: '#8B5CF6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  dim: { fontSize: 14, fontWeight: '400' as const, color: colors.textDim },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  label: { fontSize: 11, fontWeight: '600' as const, color: colors.textDim, letterSpacing: 1.2 },
};
