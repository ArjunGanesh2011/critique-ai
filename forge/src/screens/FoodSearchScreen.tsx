import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Card, Button } from '@/components/Card';
import { colors, radius, spacing } from '@/theme/colors';
import { searchFoods, SearchResult, toEntry } from '@/services/foodApi';
import { useGameStore } from '@/store/gameStore';

export default function FoodSearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [servings, setServings] = useState('1');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const logFood = useGameStore(s => s.logFood);

  const runSearch = useCallback((q: string) => {
    setLoading(true);
    searchFoods(q).then(r => {
      setResults(r);
      setLoading(false);
    });
  }, []);

  const onChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(text), 400);
  };

  const log = () => {
    if (!selected) return;
    const n = parseFloat(servings) || 1;
    logFood(toEntry(selected, n));
    setSelected(null);
    setServings('1');
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.md, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
        <TextInput
          autoFocus
          value={query}
          onChangeText={onChange}
          placeholder="Search 3M+ foods (chicken, oats, Chipotle bowl…)"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <Text style={styles.hint}>Powered by USDA + Open Food Facts</Text>
      </View>

      {loading ? (
        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={r => r.id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={
            query.length > 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
                No results. Try a different term.
              </Text>
            ) : (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>
                Start typing to search.
              </Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelected(item)}>
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: spacing.md }}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
                    <Text style={styles.macros}>
                      per {item.servingLabel} · {Math.round(item.perServing.protein)}P · {Math.round(item.perServing.carbs)}C · {Math.round(item.perServing.fat)}F
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.kcal}>{Math.round(item.perServing.kcal)}</Text>
                    <Text style={styles.kcalL}>kcal</Text>
                    <Text style={[styles.source, { color: item.source === 'usda' ? colors.success : colors.textMuted }]}>
                      {item.source === 'usda' ? 'USDA' : 'OFF'}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Servings modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            {selected && (
              <>
                <Text style={styles.modalH}>{selected.name}</Text>
                {selected.brand && <Text style={styles.brand}>{selected.brand}</Text>}
                <Text style={[styles.macros, { marginTop: spacing.md }]}>
                  Per {selected.servingLabel}: {Math.round(selected.perServing.kcal)} kcal
                </Text>

                <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>SERVINGS</Text>
                <TextInput
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="decimal-pad"
                  style={[styles.input, { marginTop: 6 }]}
                />

                <View style={styles.preview}>
                  <Text style={styles.previewK}>Total</Text>
                  <Text style={styles.previewV}>
                    {Math.round(selected.perServing.kcal * (parseFloat(servings) || 1))} kcal · {' '}
                    {Math.round(selected.perServing.protein * (parseFloat(servings) || 1))}P · {' '}
                    {Math.round(selected.perServing.carbs * (parseFloat(servings) || 1))}C · {' '}
                    {Math.round(selected.perServing.fat * (parseFloat(servings) || 1))}F
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button label="Cancel" variant="secondary" onPress={() => setSelected(null)} style={{ flex: 1 }} />
                  <Button label="Log it" onPress={log} style={{ flex: 1 }} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  hint: { color: colors.textMuted, fontSize: 11, marginTop: 8, marginLeft: 4 },
  name: { color: colors.text, fontWeight: '600', fontSize: 15 },
  brand: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  macros: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  kcal: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  kcalL: { color: colors.textMuted, fontSize: 10 },
  source: { fontSize: 9, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.bgElevated,
    padding: spacing.lg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalH: { color: colors.text, fontSize: 18, fontWeight: '700' },
  modalLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1.2 },
  preview: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  previewK: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  previewV: { color: colors.text, fontWeight: '700', marginTop: 4, fontSize: 14 },
});
