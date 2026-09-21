// Prompts for an Anthropic API key and saves it to this device only.
// The web build is public, so the key can never live in the bundle —
// it is typed in here once and persisted through the store.

import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';

export default function ApiKeyGate({ feature = 'This feature' }) {
  const setApiKey = useStore((s) => s.setApiKey);
  const [draft, setDraft] = useState('');

  const valid = draft.trim().startsWith('sk-ant-');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.h1}>Add your Anthropic key</Text>
        <Text style={styles.sub}>
          {feature} calls Claude directly from your phone. Your key is saved on this device
          only — it is never uploaded and never included in the app download.
        </Text>

        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="sk-ant-..."
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Pressable
          style={[styles.btn, !valid && styles.btnDisabled]}
          disabled={!valid}
          onPress={() => setApiKey(draft)}
        >
          <Text style={styles.btnText}>Save key</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')}>
          <Text style={styles.link}>Get a key at console.anthropic.com</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0f17' },
  container: { padding: 20, gap: 14 },
  h1: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: '#9ca3af', fontSize: 13, lineHeight: 19 },
  input: {
    backgroundColor: '#11161f', borderColor: '#1f2937', borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, color: '#fff', fontSize: 14,
  },
  btn: { backgroundColor: '#7cf0a1', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#0b0f17', fontWeight: '800', fontSize: 15 },
  link: { color: '#7cf0a1', fontSize: 12, textAlign: 'center' },
});
