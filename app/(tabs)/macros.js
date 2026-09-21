import { useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator,
  Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useStore } from '../../lib/store';
import { searchFoods, scaleMacros, lookupBarcode } from '../../lib/foodSearch';
import MacroBar from '../../components/MacroBar';

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch',     label: 'Lunch',     icon: '🌞' },
  { key: 'dinner',    label: 'Dinner',    icon: '🌙' },
  { key: 'snack',     label: 'Snack',     icon: '🍿' },
];

// Default meal type by hour of day, so the selector pre-picks something sensible.
function suggestMeal() {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export default function Macros() {
  const today = useStore((s) => s.today);
  const goals = useStore((s) => s.goals);
  const logFood = useStore((s) => s.logFood);
  const removeEntry = useStore((s) => s.removeEntry);

  const [mode, setMode] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState('100');
  const [mealType, setMealType] = useState(suggestMeal());
  const [scannerOpen, setScannerOpen] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  // Synchronous lock — useState is async so the camera can fire 5+ times
  // before lastScanned actually updates. A ref blocks instantly.
  const scanLockRef = useRef(false);
  const [scanning, setScanning] = useState(false);

  const onSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await searchFoods(query);
      setResults(r);
      if (r.length === 0) Alert.alert('No results', 'Try a simpler term, or try the barcode mode for packaged foods.');
    } catch (e) {
      Alert.alert('Search failed', e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleBarcode = async ({ data }) => {
    // Hard lock — first scan wins, ignore everything else until scanner re-opens.
    if (!data || scanLockRef.current) return;
    scanLockRef.current = true;
    setScannerOpen(false);
    setScanning(true);
    try {
      const product = await lookupBarcode(data);
      if (!product) {
        Alert.alert(
          'Not found',
          `Barcode ${data} isn't in any of our databases (OFF, USDA, UPC Item DB).\n\nTry searching by name instead.`
        );
        return;
      }
      // If the product came back without macros (UPC Item DB only), warn the user.
      if (product.source?.includes('no macros')) {
        Alert.alert(
          'Found but no macros',
          `Identified as "${product.name}" but no nutrition data is available. Try searching by name to find a similar item with macros.`
        );
        return;
      }
      setSelected(product);
    } catch (e) {
      Alert.alert('Lookup failed', `${e.message}\n\nTry searching by name instead.`);
    } finally {
      setScanning(false);
    }
  };

  const openScanner = async () => {
    if (!permission) return;
    if (!permission.granted) {
      const res = await requestPermission();
      if (!res.granted) return Alert.alert('Camera needed', 'Enable camera permission to scan barcodes.');
    }
    scanLockRef.current = false;
    setScannerOpen(true);
  };

  const onConfirmLog = () => {
    const g = parseFloat(grams) || 0;
    if (g <= 0) return Alert.alert('Bad portion', 'Enter grams > 0.');
    const m = scaleMacros(selected.macrosPer100g, g);
    const result = logFood({
      name: `${selected.name} (${g}g)`,
      ...m,
      mealType,
      source: mode === 'barcode' ? 'barcode' : 'search',
    });
    setSelected(null);
    setGrams('100');
    setQuery('');
    setResults([]);
    if (result?.newlyHit?.length > 0) {
      Alert.alert('🎯 Goal hit!', `You hit your daily ${result.newlyHit.join(', ')} goal. +${result.totalXp} XP`);
    }
  };

  // Group today's entries by meal
  const byMeal = useMemo(() => {
    const groups = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const e of today.entries) {
      const k = e.mealType || 'snack';
      (groups[k] || groups.snack).push(e);
    }
    return groups;
  }, [today.entries]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Macros</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>MACROS</Text>
          <MacroBar label="Calories" current={today.calories} goal={goals.calories} color="#f97316" unit="" />
          <MacroBar label="Protein"  current={today.protein}  goal={goals.protein}  color="#7cf0a1" />
          <MacroBar label="Carbs"    current={today.carbs}    goal={goals.carbs}    color="#60a5fa" />
          <MacroBar label="Fat"      current={today.fat}      goal={goals.fat}      color="#a78bfa" />
          <MacroBar label="Sugar (max)" current={today.sugar} goal={goals.sugar} color="#f472b6" />
          <MacroBar label="Fiber"    current={today.fiber}    goal={goals.fiber}    color="#84cc16" />

          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>MICRONUTRIENTS</Text>
          <MacroBar label="Sodium (max)" current={today.sodium}    goal={goals.sodium}    color="#fbbf24" unit="mg" />
          <MacroBar label="Potassium"    current={today.potassium} goal={goals.potassium} color="#22d3ee" unit="mg" />
          <MacroBar label="Calcium"      current={today.calcium}   goal={goals.calcium}   color="#e5e7eb" unit="mg" />
          <MacroBar label="Iron"         current={today.iron}      goal={goals.iron}      color="#f87171" unit="mg" />
          <MacroBar label="Vitamin C"    current={today.vitaminC}  goal={goals.vitaminC}  color="#fde047" unit="mg" />
          <MacroBar label="Vitamin A"    current={today.vitaminA}  goal={goals.vitaminA}  color="#fb923c" unit="mcg" />
          <MacroBar label="Vitamin D"    current={today.vitaminD}  goal={goals.vitaminD}  color="#c084fc" unit="mcg" />

          {today.nutrientGoalsHit?.length > 0 && (
            <Text style={styles.goalsHit}>✓ Hit today: {today.nutrientGoalsHit.join(', ')}</Text>
          )}
        </View>

        {/* Mode switch */}
        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode('search')} style={[styles.modeBtn, mode === 'search' && styles.modeBtnActive]}>
            <Text style={[styles.modeText, mode === 'search' && styles.modeTextActive]}>🔎 Search</Text>
          </Pressable>
          <Pressable onPress={() => setMode('barcode')} style={[styles.modeBtn, mode === 'barcode' && styles.modeBtnActive]}>
            <Text style={[styles.modeText, mode === 'barcode' && styles.modeTextActive]}>📷 Barcode</Text>
          </Pressable>
        </View>

        {mode === 'search' ? (
          <>
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search food (e.g. coconut water, ruffles)"
                placeholderTextColor="#6b7280"
                style={styles.input}
                onSubmitEditing={onSearch}
                returnKeyType="search"
              />
              <Pressable onPress={onSearch} style={styles.searchBtn}>
                {searching ? <ActivityIndicator color="#0b0f17" /> : <Text style={styles.searchBtnText}>Find</Text>}
              </Pressable>
            </View>
            {results.length > 0 && results.map((item) => (
              <Pressable key={item.id} style={styles.resultRow} onPress={() => setSelected(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.resultBrand} numberOfLines={1}>
                    {item.brand || '—'} · {item.source}
                  </Text>
                </View>
                <Text style={styles.resultMacros}>
                  {Math.round(item.macrosPer100g.calories)} kcal · {Math.round(item.macrosPer100g.protein)}g P
                </Text>
              </Pressable>
            ))}
          </>
        ) : (
          <Pressable onPress={openScanner} style={styles.scanCta} disabled={scanning}>
            <Text style={styles.scanCtaIcon}>{scanning ? '⏳' : '📷'}</Text>
            <Text style={styles.scanCtaText}>
              {scanning ? 'Looking up…' : 'Tap to scan a barcode'}
            </Text>
            <Text style={styles.scanCtaSub}>
              {scanning ? 'Trying OFF, USDA, UPC Item DB…' : 'UPC / EAN on packaged foods'}
            </Text>
          </Pressable>
        )}

        <Text style={[styles.h2, { marginTop: 12 }]}>Today's log</Text>
        {today.entries.length === 0 ? (
          <Text style={styles.empty}>Nothing logged yet. Crush it.</Text>
        ) : (
          MEALS.map((m) => byMeal[m.key].length > 0 && (
            <View key={m.key} style={styles.mealGroup}>
              <Text style={styles.mealHeader}>{m.icon} {m.label.toUpperCase()}</Text>
              {byMeal[m.key].map((item) => (
                <View key={item.id} style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.entryMeta}>
                      {item.calories} kcal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
                    </Text>
                  </View>
                  <Pressable onPress={() => removeEntry(item.id)} style={styles.delBtn}>
                    <Text style={styles.delText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Portion + meal modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{selected?.name}</Text>
              <Text style={styles.modalBrand}>{selected?.brand} · {selected?.source}</Text>

              <Text style={styles.modalLabel}>Meal</Text>
              <View style={styles.mealPickerRow}>
                {MEALS.map((m) => (
                  <Pressable
                    key={m.key}
                    onPress={() => setMealType(m.key)}
                    style={[styles.mealChip, mealType === m.key && styles.mealChipActive]}
                  >
                    <Text style={styles.mealChipIcon}>{m.icon}</Text>
                    <Text style={[styles.mealChipText, mealType === m.key && styles.mealChipTextActive]}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.modalLabel}>Portion (grams)</Text>
              <TextInput
                value={grams}
                onChangeText={setGrams}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#6b7280"
              />

              {selected && (
                <View style={styles.previewBox}>
                  {(() => {
                    const g = parseFloat(grams) || 0;
                    const m = scaleMacros(selected.macrosPer100g, g);
                    return (
                      <Text style={styles.previewText}>
                        {Math.round(m.calories)} kcal · {Math.round(m.protein)}g P · {Math.round(m.carbs)}g C · {Math.round(m.fat)}g F{'\n'}
                        Sugar {Math.round(m.sugar)}g · Fiber {Math.round(m.fiber)}g · K {Math.round(m.potassium)}mg
                      </Text>
                    );
                  })()}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Pressable onPress={() => setSelected(null)} style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={onConfirmLog} style={[styles.btn, styles.btnPrimary]}>
                  <Text style={styles.btnPrimaryText}>Log it</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
        <View style={styles.scannerWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={handleBarcode}
          />
          <View style={styles.scanOverlay}>
            <Text style={styles.scanHint}>Align barcode within the frame</Text>
            <View style={styles.scanFrame} />
            <Pressable onPress={() => setScannerOpen(false)} style={styles.scanClose}>
              <Text style={styles.scanCloseText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 14, paddingBottom: 60 },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' },
  h2: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10 },
  card: { backgroundColor: '#11161f', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1f2937' },
  goalsHit: { color: '#7cf0a1', fontSize: 12, fontWeight: '600', marginTop: 10 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1, paddingVertical: 10, backgroundColor: '#11161f', borderRadius: 10,
    borderWidth: 1, borderColor: '#1f2937', alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#7cf0a1', borderColor: '#7cf0a1' },
  modeText: { color: '#d1d5db', fontWeight: '700', fontSize: 13 },
  modeTextActive: { color: '#0b0f17' },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 15,
  },
  searchBtn: {
    backgroundColor: '#7cf0a1', paddingHorizontal: 18, borderRadius: 10, justifyContent: 'center',
  },
  searchBtnText: { color: '#0b0f17', fontWeight: '800' },
  scanCta: {
    backgroundColor: '#11161f', borderRadius: 14, borderWidth: 1, borderColor: '#7cf0a1',
    padding: 28, alignItems: 'center',
  },
  scanCtaIcon: { fontSize: 44, marginBottom: 8 },
  scanCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scanCtaSub: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomColor: '#1f2937', borderBottomWidth: 1,
  },
  resultName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultBrand: { color: '#9ca3af', fontSize: 12 },
  resultMacros: { color: '#7cf0a1', fontSize: 12, fontWeight: '600', marginLeft: 8 },
  empty: { color: '#6b7280', fontStyle: 'italic', marginTop: 8 },
  mealGroup: { marginTop: 10 },
  mealHeader: { color: '#7cf0a1', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomColor: '#1f2937', borderBottomWidth: 1,
  },
  entryName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  entryMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  delBtn: { padding: 8 },
  delText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },

  modalBg: { flex: 1, backgroundColor: '#000000cc' },
  modalCard: {
    backgroundColor: '#11161f', padding: 22,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderColor: '#1f2937', borderWidth: 1,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalBrand: { color: '#9ca3af', fontSize: 13, marginBottom: 14 },
  modalLabel: { color: '#d1d5db', fontSize: 13, marginBottom: 6, marginTop: 8 },
  mealPickerRow: { flexDirection: 'row', gap: 6 },
  mealChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#1f2937', backgroundColor: '#0b0f17', alignItems: 'center',
  },
  mealChipActive: { backgroundColor: '#7cf0a1', borderColor: '#7cf0a1' },
  mealChipIcon: { fontSize: 18 },
  mealChipText: { color: '#9ca3af', fontSize: 11, fontWeight: '700', marginTop: 2 },
  mealChipTextActive: { color: '#0b0f17' },
  previewBox: { backgroundColor: '#0b0f17', borderRadius: 10, padding: 12, marginTop: 12 },
  previewText: { color: '#7cf0a1', fontSize: 13, fontWeight: '600', lineHeight: 20 },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnGhost: { backgroundColor: '#1f2937' },
  btnGhostText: { color: '#d1d5db', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#7cf0a1' },
  btnPrimaryText: { color: '#0b0f17', fontWeight: '800' },

  scannerWrap: { flex: 1, backgroundColor: '#000' },
  scanOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', padding: 24 },
  scanHint: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 18, textAlign: 'center' },
  scanFrame: { width: 280, height: 180, borderRadius: 14, borderWidth: 3, borderColor: '#7cf0a1' },
  scanClose: { marginTop: 30, backgroundColor: '#ffffffee', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  scanCloseText: { color: '#0b0f17', fontWeight: '700' },
});
