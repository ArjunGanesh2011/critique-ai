import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useStore } from '../../lib/store';
import { estimateMacrosFromPhoto } from '../../lib/claudeVision';
import ApiKeyGate from '../../components/ApiKeyGate';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const logFood = useStore((s) => s.logFood);
  const apiKey = useStore((s) => s.apiKey);

  if (!permission) return <View style={styles.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permWrap}>
          <Text style={styles.h1}>Camera access</Text>
          <Text style={styles.sub}>
            Snap a photo of your plate and Claude will estimate macros.
          </Text>
          <Pressable onPress={requestPermission} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Grant permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      });
      setPhotoUri(photo.uri);
      setResult(null);
      setAnalyzing(true);
      const data = await estimateMacrosFromPhoto(photo.base64, apiKey);
      setResult(data);
    } catch (e) {
      Alert.alert('Analysis failed', e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const logEverything = () => {
    if (!result?.total) return;
    const r = logFood({
      name: result.items?.map((i) => i.name).join(', ').slice(0, 60) || 'Snap log',
      calories: result.total.calories,
      protein: result.total.protein_g,
      carbs: result.total.carbs_g,
      fat: result.total.fat_g,
      sugar: result.total.sugar_g,
      fiber: result.total.fiber_g,
      sodium: result.total.sodium_mg,
      potassium: result.total.potassium_mg,
      source: 'camera',
    });
    const extra = r?.newlyHit?.length > 0
      ? `\n\n🎯 Hit goal: ${r.newlyHit.join(', ')} (+${r.totalXp} bonus XP)`
      : '';
    Alert.alert('Logged!', 'Added to today\'s macros. +5 XP' + extra);
    setPhotoUri(null);
    setResult(null);
  };

  if (!apiKey) {
    return <ApiKeyGate feature="Photo macro scanning" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Snap a meal</Text>

        {!photoUri ? (
          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
            <Pressable style={styles.shutter} onPress={takePhoto}>
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Image source={{ uri: photoUri }} style={styles.preview} />

            {analyzing && (
              <View style={styles.statusBox}>
                <ActivityIndicator color="#7cf0a1" />
                <Text style={styles.statusText}>Claude is analyzing your plate…</Text>
              </View>
            )}

            {!analyzing && result && (
              <View style={styles.resultCard}>
                <Text style={styles.resultHeader}>Estimate ({result.confidence || 'unknown'} confidence)</Text>
                {result.items?.length === 0 && (
                  <Text style={styles.sub}>No food detected. Try a clearer shot.</Text>
                )}
                {result.items?.map((it, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName}>{it.name}</Text>
                    <Text style={styles.itemMeta}>
                      {it.portion} · {Math.round(it.calories)} kcal · {Math.round(it.protein_g)}g P
                    </Text>
                  </View>
                ))}
                {result.total && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                    <Text style={styles.totalVal}>
                      {Math.round(result.total.calories)} kcal · {Math.round(result.total.protein_g)}g P · {Math.round(result.total.carbs_g)}g C · {Math.round(result.total.fat_g)}g F
                    </Text>
                  </View>
                )}
                {!!result.notes && <Text style={styles.notes}>{result.notes}</Text>}
              </View>
            )}

            <View style={styles.btnRow}>
              <Pressable
                onPress={() => {
                  setPhotoUri(null);
                  setResult(null);
                }}
                style={[styles.btnGhost, { flex: 1 }]}
              >
                <Text style={styles.btnGhostText}>Retake</Text>
              </Pressable>
              {result?.total && (
                <Pressable onPress={logEverything} style={[styles.btnPrimary, { flex: 1 }]}>
                  <Text style={styles.btnPrimaryText}>Log it</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 14 },
  h1: { color: '#fff', fontSize: 26, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 14 },
  permWrap: { padding: 24, gap: 14 },
  cameraWrap: {
    aspectRatio: 3 / 4,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  preview: { aspectRatio: 3 / 4, borderRadius: 18, backgroundColor: '#11161f' },
  statusBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#11161f',
    borderRadius: 12,
    padding: 14,
    borderColor: '#1f2937',
    borderWidth: 1,
  },
  statusText: { color: '#d1d5db', fontSize: 14 },
  resultCard: {
    backgroundColor: '#11161f',
    borderRadius: 14,
    padding: 16,
    borderColor: '#1f2937',
    borderWidth: 1,
  },
  resultHeader: { color: '#9ca3af', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  itemRow: { paddingVertical: 8, borderBottomColor: '#1f2937', borderBottomWidth: 1 },
  itemName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  itemMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  totalRow: { marginTop: 12 },
  totalLabel: { color: '#7cf0a1', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  totalVal: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 4 },
  notes: { color: '#6b7280', fontStyle: 'italic', fontSize: 12, marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnGhost: { backgroundColor: '#1f2937', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnGhostText: { color: '#d1d5db', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#7cf0a1', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#0b0f17', fontWeight: '800' },
  warn: { color: '#fbbf24', fontSize: 12, fontStyle: 'italic', marginTop: 8 },
});
