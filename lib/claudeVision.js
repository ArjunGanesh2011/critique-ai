// Claude Vision API wrapper for food-photo macro estimation.
// SECURITY NOTE: This calls Anthropic directly from the device using EXPO_PUBLIC_*.
// That's fine for personal use, but if you ever ship this to other users,
// proxy through your own server so the key isn't shipped in the app bundle.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const PROMPT = `You are a nutritionist analyzing a photo of food.
Identify each visible food item and estimate its portion size and full nutrition.
Return ONLY valid JSON in this exact shape, no markdown, no commentary:

{
  "items": [
    {
      "name": "string",
      "portion": "string (e.g. '1 cup', '6 oz')",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "sugar_g": number,
      "fiber_g": number,
      "sodium_mg": number,
      "potassium_mg": number
    }
  ],
  "total": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number,
    "sugar_g": number,
    "fiber_g": number,
    "sodium_mg": number,
    "potassium_mg": number
  },
  "confidence": "low" | "medium" | "high",
  "notes": "string — any caveats about visibility, hidden ingredients, etc."
}

Use 0 for any field you can't reasonably estimate. If no food is visible, return items: [] and confidence: "low".`;

export async function estimateMacrosFromPhoto(base64Jpeg, apiKey) {
  if (!apiKey) {
    throw new Error(
      'No Anthropic API key. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env and restart Expo.'
    );
  }
  const body = {
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Jpeg },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  };

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text || '';
  // Strip code fences if model wrapped JSON
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Could not parse Claude response as JSON. Raw: ${text.slice(0, 300)}`);
  }
}
