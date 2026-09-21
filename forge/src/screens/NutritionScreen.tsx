import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Section } from '@/components/Card';
import { Ring } from '@/components/Ring';
import { colors, radius, spacing } from '@/theme/colors';
import { useGameStore } from '@/store/gameStore';

export default function NutritionScreen({ navigation }: any) {
  const profile = useGameStore(s => s.profile);
  const todaysFood = useGameStore(s => s.todaysFood);
  const removeFood = useGameStore(s => s.removeFood);

  const kcal = todaysFood.reduce((s, f) => s + f.calories, 0);
  const protein = todaysFood.reduce((s, f) => s + f.proteinG, 0);
  const carbs = todaysFood.reduce((s, f) => s + f.carbsG, 0);
  const fat = todaysFood.reduce((s, f) => s + f.fatG, 0);

  const target = profile?.targetCalories || 2200;
  const remaining = target - kcal;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <Text style={styles.h}>Nutrition</Text>
        <Text style={styles.sub}>Track every bite. Hit your macros. Earn XP.</Text>

        <Card style={{ marginTop: spacing.md, alignItems: 'center', padding: spacing.lg }}>
          <Ring
            size={180} stroke={14}
            progress={kcal / target}
            centerText={`${Math.round(kcal)}`}
            centerSub={`of ${target} kcal`}
          />
          <Text style={{ color: remaining < 0 ? colors.danger : colors.textDim, marginTop: spacing.md, fontSize: 14 }}>
            {remaining >= 0 ? `${remaining} kcal remaining` : `${-remaining} kcal over budget`}
          </Text>
          <View style={styles.macros}>
            <MacroPill color={colors.protein} val={protein} target={profile?.targetProteinG || 150} label="P" />
            <MacroPill color={colors.carbs} val={carbs} target={profile?.targetCarbsG || 250} label="C" />
            <MacroPill color={colors.fat} val={fat} target={profile?.targetFatG || 70} label="F" />
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          <Button label="Search Food" onPress={() => navigation.navigate('FoodSearch')} style={{ flex: 1 }} />
          <Button label="Scan Photo" variant="secondary" onPress={() => navigation.navigate('PhotoMacro')} style={{ flex: 1 }} />
        </View>

        <Section label={`LOGGED TODAY (${todaysFood.length})`} style={{ marginTop: spacing.xl }}>
          {todaysFood.length === 0 ? (
            <Card>
              <Text style={{ color: colors.textMuted, textAlign: 'center', padding: spacing.md }}>
                Nothing logged yet. Search a food or snap a photo of your meal.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {todaysFood.slice().reverse().map(f => (
                <TouchableOpacity
                  key={f.id}
                  onLongPress={() => {
                    Alert.alert('Delete entry?', f.name, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => removeFood(f.id) },
                    ]);
                  }}
                >
                  <Card>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryName}>{f.name}</Text>
                        {f.brand && <Text style={styles.entryBrand}>{f.brand}</Text>}
                        <Text style={styles.entryMacros}>
                          {Math.round(f.servingG)}g · {f.proteinG}P · {f.carbsG}C · {f.fatG}F
                        </Text>
                      </View>
                      <Text style={styles.entryKcal}>{f.calories} kcal</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const MacroPill = ({ color, val, target, label }: any) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ color, fontSize: 18, fontWeight: '700' }}>{Math.round(val)}<Text style={{ fontSize: 11, color: colors.textMuted }}>/{target}g</Text></Text>
    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  h: { color: colors.text, fontSize: 28, fontWeight: '700' },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  macros: { flexDirection: 'row', width: '100%', marginTop: spacing.lg, paddingHorizontal: spacing.md },
  entryName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  entryBrand: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  entryMacros: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  entryKcal: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});
