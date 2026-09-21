// Claude-powered diet plan generator. Uses the user's profile and macro targets
// to produce a personalized 7-day meal plan.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

export async function generateDietPlan({ profile, goals, apiKey }) {
  if (!apiKey) {
    throw new Error('Set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env to use the diet generator.');
  }
  if (!profile?.weightKg || !profile?.age) {
    throw new Error('Complete your profile first (weight, age, etc.).');
  }

  const heightFt = Math.floor((profile.heightCm || 0) / 30.48);
  const heightIn = Math.round(((profile.heightCm || 0) / 2.54) - heightFt * 12);
  const weightLb = Math.round((profile.weightKg || 0) * 2.2046);
  const goalWeightLb = Math.round((profile.goalWeightKg || 0) * 2.2046);

  const userBlock = `User profile:
- Name: ${profile.name || 'User'}
- Age: ${profile.age}, ${profile.sex}
- Height: ${heightFt}'${heightIn}"
- Current weight: ${weightLb} lb
- Goal weight: ${goalWeightLb} lb
- Goal: ${profile.goal === 'lose' ? 'Lose fat' : profile.goal === 'gain' ? 'Build muscle (lean bulk)' : 'Maintain'}
- Activity level: ${profile.activityLevel}
- Diet preferences/restrictions: ${profile.dietPreferences || 'none specified'}

Daily macro targets:
- Calories: ${goals.calories} kcal
- Protein: ${goals.protein} g
- Carbs: ${goals.carbs} g
- Fat: ${goals.fat} g
- Fiber: ${goals.fiber} g`;

  const prompt = `You are a sports nutritionist building a 7-day meal plan.

${userBlock}

Build a 7-day plan. Each day must:
- Hit the daily macro targets within ±10%
- Include 3 meals (breakfast, lunch, dinner) and 1-2 snacks
- Use real, accessible foods (not fancy restaurant items)
- Vary across days (don't repeat the same meal more than twice in the week)
- Respect the diet preferences/restrictions

Return ONLY valid JSON in this exact shape, no markdown, no commentary:

{
  "summary": "2-sentence overview of the strategy and key foods",
  "days": [
    {
      "day": "Monday",
      "totals": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number },
      "meals": [
        {
          "meal": "breakfast" | "lunch" | "dinner" | "snack",
          "name": "string (e.g. 'Greek yogurt parfait')",
          "ingredients": ["string with portions, e.g. '1 cup nonfat greek yogurt'", ...],
          "macros": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number }
        }
      ]
    }
  ],
  "shoppingList": ["categorized grocery items needed for the week"],
  "tips": ["3-5 short prep/timing tips specific to this plan"]
}`;

  const body = {
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
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
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    parsed.generatedAt = new Date().toISOString();
    return parsed;
  } catch (e) {
    throw new Error(`Could not parse Claude response. Raw: ${text.slice(0, 300)}`);
  }
}
