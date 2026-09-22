// USDA FoodData Central wrapper.
// Free, ~400k foods including branded items (Ruffles, Coca-Cola, etc.).
// Uses DEMO_KEY by default — rate limit ~30 req/hour. Get a free key at
// https://fdc.nal.usda.gov/api-key-signup.html and put it in your .env as
// EXPO_PUBLIC_USDA_API_KEY=your_key for higher limits.
// Docs: https://fdc.nal.usda.gov/api-guide.html

const BASE = 'https://api.nal.usda.gov/fdc/v1';
const API_KEY = process.env.EXPO_PUBLIC_USDA_API_KEY || 'DEMO_KEY';

// Map USDA nutrient IDs → our internal field names.
// Reference: https://fdc.nal.usda.gov/portal-data/external/dataDictionary
const NUTRIENT_MAP = {
  1008: 'calories',  // Energy (kcal)
  1003: 'protein',   // Protein (g)
  1005: 'carbs',     // Carbohydrate (g)
  1004: 'fat',       // Fat (g)
  2000: 'sugar',     // Sugars (g)
  1079: 'fiber',     // Fiber (g)
  1093: 'sodium',    // Sodium (mg)
  1092: 'potassium', // Potassium (mg)
  1087: 'calcium',   // Calcium (mg)
  1089: 'iron',      // Iron (mg)
  1162: 'vitaminC',  // Vitamin C (mg)
  1106: 'vitaminA',  // Vitamin A, RAE (mcg)
  1114: 'vitaminD',  // Vitamin D (mcg)
};

// Bare measurements are not countable units: "500 ml" is not something you
// have two of the way you have two pouches.
const MEASURE_ONLY = /^(g|gram|grams|kg|ml|millilitre|milliliter|l|litre|liter|cl|oz|ounce|ounces|fl oz|lb|lbs)$/i;

// USDA branded foods publish a serving weight and often a household measure
// ("1 pouch", "2 tbsp"). Returns null when the serving is missing or measured
// by volume, where grams cannot be inferred.
function parseServing(f) {
  const grams = Number(f.servingSize);
  const unitIsWeight = String(f.servingSizeUnit || '').toLowerCase() === 'g';
  if (!grams || grams <= 0 || !unitIsWeight) return null;
  const household = String(f.householdServingFullText || '').trim();
  // Drop the leading count, the app supplies its own.
  const unit = household.replace(/\([^)]*\)/g, ' ').replace(/[\d.,/]+/g, ' ').trim();
  const clean = !unit || MEASURE_ONLY.test(unit) ? 'serving' : unit;
  return { unit: clean, unitPlural: clean + 's', grams, label: household || null };
}

function nutrientsToMacros(foodNutrients = []) {
  const out = {
    calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0,
    sodium: 0, potassium: 0, calcium: 0, iron: 0,
    vitaminC: 0, vitaminA: 0, vitaminD: 0,
  };
  for (const n of foodNutrients) {
    // Different USDA endpoints use different shapes
    const id = n.nutrientId || n.nutrient?.id || n.id;
    const value = n.value ?? n.amount ?? 0;
    const field = NUTRIENT_MAP[id];
    if (field) out[field] = Number(value) || 0;
  }
  return out;
}

// Search USDA — returns array of unified result objects.
// `dataTypes` filters: Branded (UPC products), Foundation (raw), SR Legacy (older), Survey (recipes).
export async function searchUsda(query, { pageSize = 25, dataTypes = ['Branded', 'Foundation', 'SR Legacy', 'Survey (FNDDS)'] } = {}) {
  if (!query || query.trim().length < 2) return [];
  const url = `${BASE}/foods/search?api_key=${API_KEY}`;
  const body = {
    query: query.trim(),
    pageSize,
    dataType: dataTypes,
    sortBy: 'dataType.keyword',
    sortOrder: 'asc',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error('USDA rate-limited (DEMO_KEY=30/hr). Add EXPO_PUBLIC_USDA_API_KEY for unlimited.');
    throw new Error(`USDA search failed (${res.status})`);
  }
  const data = await res.json();
  return (data.foods || [])
    .map((f) => ({
      id: 'usda_' + f.fdcId,
      name: f.description || 'Unnamed',
      brand: f.brandName || f.brandOwner || '',
      source: 'USDA',
      serving: parseServing(f),
      // USDA branded foods come per "serving size", others per 100g.
      // We normalize everything to per-100g for consistency.
      macrosPer100g: nutrientsToMacros(f.foodNutrients),
    }))
    .filter((p) => p.macrosPer100g.calories > 0);
}

// Barcode lookup via USDA — branded foods often searchable by GTIN/UPC code.
export async function barcodeUsda(code) {
  if (!code) return null;
  const url = `${BASE}/foods/search?api_key=${API_KEY}`;
  const body = {
    query: code,
    pageSize: 5,
    dataType: ['Branded'],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Match by exact GTIN/UPC if possible
  const exact = (data.foods || []).find(
    (f) => (f.gtinUpc || '').replace(/^0+/, '') === code.replace(/^0+/, '')
  );
  const f = exact || (data.foods || [])[0];
  if (!f) return null;
  return {
    id: 'usda_' + f.fdcId,
    name: f.description || 'Unknown product',
    brand: f.brandName || f.brandOwner || '',
    source: 'USDA',
    serving: parseServing(f),
    macrosPer100g: nutrientsToMacros(f.foodNutrients),
  };
}
