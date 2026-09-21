import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card, Button } from '@/components/Card';
import { colors, radius, spacing } from '@/theme/colors';
import { analyzeFoodPhoto, PhotoMacroResult } from '@/services/aiService';
import { useGameStore } from '@/store/gameStore';

export default function PhotoMacroScreen({ navigation }: any) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhotoMacroResult | null>(null);
  const logFood = useGameStore(s => s.logFood);

  const pickImage = async (source: 'camera' | 'library') => {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', `We need ${source} access to scan your meal.`);
      return;
    }
    const res = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: false })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: false });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
    }
  };

  const analyze = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const r = await analyzeFoodPhoto(imageUri);
      setResult(r);
    } catch (e: any) {
      Alert.alert('Analysis failed', e.message || 'Add your Anthropic API key in src/config.ts.');
    } finally {
      setLoading(false);
    }
  };

  const logIt = () => {
    if (!result) return;
    logFood({
      id: `entry-${Date.now()}`,
      name: result.foodName,
      servingG: result.estimatedGrams,
      calories: result.calories,
      proteinG: result.proteinG,
      carbsG: result.carbsG,
      fatG: result.fatG,
      loggedAt: Date.now(),
      source: 'photo',
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.h}>Snap a meal</Text>
      <Text style={styles.sub}>AI estimates macros from the photo. Confidence stays honest — low when it can't see clearly.</Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <View style={[styles.preview, styles.placeholder]}>
          <Text style={{ color: colors.textMuted }}>No image yet</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <Button label="Camera" onPress={() => pickImage('camera')} style={{ flex: 1 }} />
        <Button label="From Library" variant="secondary" onPress={() => pickImage('library')} style={{ flex: 1 }} />
      </View>

      {imageUri && !result && (
        <Button label={loading ? 'Analyzing…' : 'Analyze macros'} onPress={analyze} disabled={loading} style={{ marginTop: spacing.md }} />
      )}

      {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} />}

      {result && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text style={styles.cardLabel}>ESTIMATE · {result.confidence.toUpperCase()} CONFIDENCE</Text>
          <Text style={styles.foodName}>{result.foodName}</Text>
          <Text style={styles.servings}>~{result.estimatedGrams}g</Text>

          <View style={styles.macroRow}>
            <Macro label="kcal" v={result.calories} color={colors.accent} />
            <Macro label="P" v={`${result.proteinG}g`} color={colors.protein} />
            <Macro label="C" v={`${result.carbsG}g`} color={colors.carbs} />
            <Macro label="F" v={`${result.fatG}g`} color={colors.fat} />
          </View>

          <Text style={styles.notes}>{result.notes}</Text>
          <Button label="Log this meal (+5 XP)" onPress={logIt} style={{ marginTop: spacing.md }} />
        </Card>
      )}
    </ScrollView>
  );
}

const Macro = ({ label, v, color }: any) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ color, fontSize: 18, fontWeight: '700' }}>{v}</Text>
    <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2, fontWeight: '600' }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  h: { color: colors.text, fontSize: 24, fontWeight: '700' },
  sub: { color: colors.textDim, fontSize: 13, marginTop: 4, lineHeight: 19 },
  preview: {
    width: '100%', height: 240, borderRadius: radius.lg, marginTop: spacing.lg,
    backgroundColor: colors.card,
  },
  placeholder: {
    borderColor: colors.border, borderWidth: 1, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  cardLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },
  foodName: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 6 },
  servings: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  macroRow: { flexDirection: 'row', marginTop: spacing.md, paddingVertical: spacing.md, borderTopColor: colors.border, borderTopWidth: 1, borderBottomColor: colors.border, borderBottomWidth: 1 },
  notes: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: spacing.md, fontStyle: 'italic' },
});
