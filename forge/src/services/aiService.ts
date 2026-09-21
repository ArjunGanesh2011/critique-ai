// AI service — wraps Anthropic's Messages API for vision + chat.
//
// On Android, fetch() handles base64 image payloads natively; we don't need
// a separate file upload step.

import * as FileSystem from 'expo-file-system';
import { ANTHROPIC_API_KEY, VISION_MODEL, CHAT_MODEL } from '@/config';

const API_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicResponse {
  content: Array<{ type: 'text'; text: string }>;
  error?: { message: string };
}

async function callClaude(payload: object): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('No Anthropic API key. Add it in src/config.ts');
  }
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  });
  const data: AnthropicResponse = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || '';
}

async function imageToBase64(uri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

// --- Photo → macros ---
export interface PhotoMacroResult {
  foodName: string;
  estimatedGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: 'low' | 'medium' | 'high';
  notes: string;
}

const PHOTO_MACRO_PROMPT = `You are a registered dietitian estimating macros from a food photo. Look at the meal and respond with ONLY valid JSON, no preamble, in this exact shape:

{
  "foodName": "concise dish name",
  "estimatedGrams": <number>,
  "calories": <number>,
  "proteinG": <number>,
  "carbsG": <number>,
  "fatG": <number>,
  "confidence": "low" | "medium" | "high",
  "notes": "1-sentence honest caveat about the estimate"
}

Be conservative. If you can't see the food clearly, say so in notes and pick confidence=low.`;

export async function analyzeFoodPhoto(imageUri: string): Promise<PhotoMacroResult> {
  const b64 = await imageToBase64(imageUri);
  const text = await callClaude({
    model: VISION_MODEL,
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
        { type: 'text', text: PHOTO_MACRO_PROMPT },
      ],
    }],
  });
  return JSON.parse(extractJSON(text));
}

// --- Outfit rating ---
export interface OutfitResult {
  overallScore: number; // 1-10
  fit: string;
  color: string;
  style: string;
  suggestions: string[];
}

export async function analyzeOutfit(imageUri: string): Promise<OutfitResult> {
  const b64 = await imageToBase64(imageUri);
  const text = await callClaude({
    model: VISION_MODEL,
    max_tokens: 700,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
        { type: 'text', text: `Rate this outfit honestly. Respond with ONLY valid JSON:

{
  "overallScore": <1-10>,
  "fit": "1-2 sentences on how the clothes fit",
  "color": "1-2 sentences on color coordination",
  "style": "1-2 sentences on the overall style/vibe",
  "suggestions": ["3-5 specific, actionable improvements"]
}

Be direct. No fluff. If the outfit is mid, say it's mid.` },
      ],
    }],
  });
  return JSON.parse(extractJSON(text));
}

// --- Physique scan ---
export interface PhysiqueResult {
  bodyFatEstimate: string;
  muscleMass: string;
  strengths: string[];
  weakPoints: string[];
  trainingTips: string[];
}

export async function analyzePhysique(imageUri: string): Promise<PhysiqueResult> {
  const b64 = await imageToBase64(imageUri);
  const text = await callClaude({
    model: VISION_MODEL,
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
        { type: 'text', text: `Analyze this physique photo as an experienced strength coach. Respond with ONLY valid JSON:

{
  "bodyFatEstimate": "X-Y%",
  "muscleMass": "1 sentence on overall muscle mass",
  "strengths": ["3 body parts/areas that look developed"],
  "weakPoints": ["3 body parts that lag and should be prioritized"],
  "trainingTips": ["4 specific training/nutrition recommendations"]
}

Be brutally honest but constructive. The user wants real feedback, not flattery.` },
      ],
    }],
  });
  return JSON.parse(extractJSON(text));
}

// --- Posture analysis (side-profile) ---
export interface PostureResult {
  headPosition: string;
  shoulderAlignment: string;
  spineAlignment: string;
  hipAlignment: string;
  primaryIssue: string;
  correctiveExercises: string[];
}

export async function analyzePosture(imageUri: string): Promise<PostureResult> {
  const b64 = await imageToBase64(imageUri);
  const text = await callClaude({
    model: VISION_MODEL,
    max_tokens: 700,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
        { type: 'text', text: `Analyze this side-profile posture photo. Respond with ONLY valid JSON:

{
  "headPosition": "neutral | forward | tilted — short description",
  "shoulderAlignment": "neutral | rounded | elevated — short description",
  "spineAlignment": "neutral | excessive lordosis | excessive kyphosis | etc.",
  "hipAlignment": "neutral | anterior tilt | posterior tilt",
  "primaryIssue": "the #1 thing to fix",
  "correctiveExercises": ["4-5 specific exercises with sets/reps"]
}` },
      ],
    }],
  });
  return JSON.parse(extractJSON(text));
}

// --- General AI assistant chat (used in AI tab) ---
export async function chat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  systemPrompt?: string,
): Promise<string> {
  return await callClaude({
    model: CHAT_MODEL,
    max_tokens: 1500,
    system: systemPrompt || `You are Forge, an honest fitness/lifestyle coach. The user is Arjun, a 24-year-old Harvard student doing applied math + business who is skinny-fat and wants to build muscle. Be direct. No fluff. Give specific, actionable advice. If he asks something unrelated to fitness, help anyway — you are a general assistant.`,
    messages,
  });
}

// Helper to extract JSON from potentially-prefixed model output
function extractJSON(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}
