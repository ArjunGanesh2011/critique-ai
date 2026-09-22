// Built-in, serving-first food database.
//
// Online sources index products by weight, which is useless for things nobody
// weighs: a pouch of fruit snacks, a scoop of Huel, a roti. Every row carries
// the unit a person actually counts plus the grams behind it, so the app can
// log "2 scoops" and still do the macro math.
//
// Rows live in ./foods/*.js by category. Each is:
//   [name, brand, keywords, unit, grams,
//    kcal, protein, carbs, fat, sugar, fiber,
//    sodium(mg), potassium(mg), calcium(mg), iron(mg),
//    vitC(mg), vitA(mcg RAE), vitD(mcg)]
//
// Values are per one unit, from published labels or standard reference
// portions. They are close, not laboratory-exact: branded labels change, and
// a home-cooked dish follows whoever cooked it. Micronutrients on packaged
// foods come from the four the US requires on a label, so a processed item
// showing 0 vitamin C usually means "not declared" rather than "none".

import shakes from './foods/shakes';
import snacks from './foods/snacks';
import staples from './foods/staples';
import protein from './foods/protein';
import produce from './foods/produce';
import drinks from './foods/drinks';
import world from './foods/world';
import fastfood from './foods/fastfood';

const RAW = [
  ...shakes, ...snacks, ...staples, ...protein,
  ...produce, ...drinks, ...world, ...fastfood,
];

// "pouch" -> "pouches", "scoop" -> "scoops".
function pluralize(unit) {
  if (/(ch|sh|s|x|z)$/.test(unit)) return unit + 'es';
  return unit + 's';
}

function toItem(row, i) {
  const [
    name, brand, keywords, unit, grams,
    calories, protein_, carbs, fat, sugar, fiber,
    sodium, potassium, calcium, iron, vitaminC, vitaminA, vitaminD,
  ] = row;
  const perServing = {
    calories, protein: protein_, carbs, fat, sugar, fiber,
    sodium, potassium, calcium, iron, vitaminC, vitaminA, vitaminD,
  };
  const factor = 100 / grams;
  const macrosPer100g = {};
  for (const [k, v] of Object.entries(perServing)) macrosPer100g[k] = (v || 0) * factor;
  const cleanBrand = brand === 'generic' ? '' : brand;
  return {
    id: 'local_' + i,
    name,
    brand: cleanBrand,
    source: 'Built-in',
    serving: { unit, unitPlural: pluralize(unit), grams },
    perServing,
    macrosPer100g,
    // Loose keywords so "shake", "vegan" or "spicy" also find things.
    haystack: `${name} ${cleanBrand} ${keywords}`.toLowerCase(),
  };
}

export const LOCAL_FOODS = RAW.map(toItem);

export function searchLocal(query) {
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const hits = [];
  for (const food of LOCAL_FOODS) {
    if (!terms.every((t) => food.haystack.includes(t))) continue;
    // An exact brand match ("huel") outranks a food that merely mentions the
    // word among its keywords.
    let score = 0;
    if (food.brand.toLowerCase() === q) score += 100;
    if (food.name.toLowerCase().startsWith(q)) score += 60;
    if (food.haystack.startsWith(q)) score += 30;
    hits.push({ food, score });
  }
  // Sort is stable, so equal scores keep the table's own order, which puts the
  // flagship item of a brand ahead of its side products.
  return hits.sort((a, b) => b.score - a.score).map((h) => h.food);
}
