// Open Food Facts API wrapper.
// Free, ~3M products. Now with proper User-Agent (REQUIRED by OFF), retry on 429/502.

const BASE = 'https://world.openfoodfacts.org';
const HEADERS = {
  // OFF requires a User-Agent identifying your app — without one they rate-limit aggressively.
  'User-Agent': 'CritiqueFit/1.0 (personal-use)',
  'Accept': 'application/json',
};

async function fetchWithRetry(url, opts = {}, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { ...opts, headers: { ...HEADERS, ...(opts.headers || {}) } });
      // Retry on rate-limit and server errors with exponential backoff.
      if (res.status === 429 || res.status === 502 || res.status === 503) {
        const wait = (i + 1) * 800;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, (i + 1) * 600));
    }
  }
  if (lastErr) throw lastErr;
  // If we got rate-limited every attempt, return last response so caller can choose to fall back.
  return null;
}

// Bare measurements are not countable units: "500 ml" is not something you
// have two of the way you have two pouches.
const MEASURE_ONLY = /^(g|gram|grams|kg|ml|millilitre|milliliter|l|litre|liter|cl|oz|ounce|ounces|fl oz|lb|lbs)$/i;

// A product's own serving, when it publishes one. OFF writes these as
// "1 serving (500 g)" or "500ml": the countable name lives outside the
// parentheses, the weight inside. Returns null when nothing is usable, and
// the UI falls back to grams.
function parseServing(p) {
  const grams = Number(p.serving_quantity);
  if (!grams || grams <= 0) return null;
  const text = String(p.serving_size || '').trim();
  const outside = text.replace(/\([^)]*\)/g, ' ');
  const unit = outside.replace(/[\d.,/]+/g, ' ').trim();
  const clean = !unit || MEASURE_ONLY.test(unit) ? 'serving' : unit;
  return { unit: clean, unitPlural: clean + 's', grams, label: text || null };
}

function parseNutriments(n = {}) {
  return {
    calories: Number(n['energy-kcal_100g']) || 0,
    protein: Number(n.proteins_100g) || 0,
    carbs: Number(n.carbohydrates_100g) || 0,
    fat: Number(n.fat_100g) || 0,
    sugar: Number(n.sugars_100g) || 0,
    fiber: Number(n.fiber_100g) || 0,
    sodium: (Number(n.sodium_100g) || 0) * 1000,
    potassium: (Number(n.potassium_100g) || 0) * 1000,
    calcium: (Number(n.calcium_100g) || 0) * 1000,
    iron: (Number(n.iron_100g) || 0) * 1000,
    vitaminC: (Number(n['vitamin-c_100g']) || 0) * 1000,
    vitaminA: (Number(n['vitamin-a_100g']) || 0) * 1000000,
    vitaminD: (Number(n['vitamin-d_100g']) || 0) * 1000000,
  };
}

export async function searchOff(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,nutriments,serving_size,serving_quantity`;
  const res = await fetchWithRetry(url);
  if (!res || !res.ok) return [];
  const data = await res.json();
  return (data.products || [])
    .filter((p) => p.product_name && p.nutriments)
    .map((p) => ({
      id: 'off_' + p.code,
      name: p.product_name,
      brand: p.brands || '',
      source: 'OFF',
      serving: parseServing(p),
      macrosPer100g: parseNutriments(p.nutriments),
    }))
    .filter((p) => p.macrosPer100g.calories > 0);
}

export async function barcodeOff(code) {
  if (!code) return null;
  const url = `${BASE}/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,brands,nutriments,serving_size,serving_quantity`;
  const res = await fetchWithRetry(url);
  if (!res || !res.ok) return null;
  const data = await res.json();
  if (!data.product || !data.product.nutriments) return null;
  const p = data.product;
  return {
    id: 'off_' + p.code,
    name: p.product_name || 'Unknown product',
    brand: p.brands || '',
    source: 'OFF',
    serving: parseServing(p),
    macrosPer100g: parseNutriments(p.nutriments),
  };
}

// Scale 100g macros to chosen grams. Scales every nutrient field.
export function scaleMacros(macrosPer100g, grams) {
  const factor = grams / 100;
  const out = {};
  for (const [k, v] of Object.entries(macrosPer100g)) out[k] = v * factor;
  return out;
}
