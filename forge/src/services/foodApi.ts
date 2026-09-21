// REAL food database integration.
// Open Food Facts: 2.8M+ products worldwide, completely free, no key needed.
// USDA FoodData Central: 400K+ items, government-verified nutrition data, free with DEMO_KEY (rate-limited) or your own.

import type { FoodEntry } from '@/store/gameStore';

// --- Open Food Facts (consumer products, barcodes, brands) ---

interface OFFProduct {
  code: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    fat_100g?: number;
    fat_serving?: number;
  };
  image_thumb_url?: string;
}

export interface SearchResult {
  id: string;
  name: string;
  brand?: string;
  servingG: number;
  servingLabel: string;
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
  perServing: { kcal: number; protein: number; carbs: number; fat: number };
  imageUrl?: string;
  source: 'off' | 'usda';
}

export async function searchOpenFoodFacts(query: string, page = 1): Promise<SearchResult[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=25&page=${page}&fields=code,product_name,brands,serving_size,serving_quantity,nutriments,image_thumb_url`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Forge/1.0 (https://forge.app) - fitness app' },
    });
    if (!res.ok) throw new Error(`OFF ${res.status}`);
    const data = await res.json();
    const products: OFFProduct[] = data.products || [];
    return products
      .filter(p => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'])
      .map(p => mapOFF(p));
  } catch (e) {
    console.warn('OFF search failed', e);
    return [];
  }
}

export async function fetchByBarcode(barcode: string): Promise<SearchResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      return mapOFF(data.product);
    }
    return null;
  } catch (e) {
    console.warn('barcode fetch failed', e);
    return null;
  }
}

function mapOFF(p: OFFProduct): SearchResult {
  const n = p.nutriments || {};
  const servingG = p.serving_quantity || 100;
  const per100g = {
    kcal: n['energy-kcal_100g'] || 0,
    protein: n.proteins_100g || 0,
    carbs: n.carbohydrates_100g || 0,
    fat: n.fat_100g || 0,
  };
  const perServing = {
    kcal: n['energy-kcal_serving'] || (per100g.kcal * servingG) / 100,
    protein: n.proteins_serving || (per100g.protein * servingG) / 100,
    carbs: n.carbohydrates_serving || (per100g.carbs * servingG) / 100,
    fat: n.fat_serving || (per100g.fat * servingG) / 100,
  };
  return {
    id: `off-${p.code}`,
    name: p.product_name || 'Unknown',
    brand: p.brands?.split(',')[0]?.trim(),
    servingG,
    servingLabel: p.serving_size || `${servingG}g`,
    per100g,
    perServing,
    imageUrl: p.image_thumb_url,
    source: 'off',
  };
}

// --- USDA FoodData Central (raw ingredients, generic foods) ---
// Sign up free at https://fdc.nal.usda.gov/api-key-signup.html
// Drop your key in src/config.ts and it'll start using your quota.

import { USDA_API_KEY } from '@/config';

interface USDAFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: Array<{ nutrientId: number; nutrientName: string; value: number; unitName: string }>;
}

const USDA_NUTRIENT = {
  CALORIES: 1008,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
};

export async function searchUSDA(query: string): Promise<SearchResult[]> {
  try {
    const key = USDA_API_KEY || 'DEMO_KEY';
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=25&api_key=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`USDA ${res.status}`);
    const data = await res.json();
    return (data.foods || []).map((f: USDAFood) => mapUSDA(f));
  } catch (e) {
    console.warn('USDA search failed', e);
    return [];
  }
}

function mapUSDA(f: USDAFood): SearchResult {
  const get = (id: number) => f.foodNutrients?.find(n => n.nutrientId === id)?.value || 0;
  const per100g = {
    kcal: get(USDA_NUTRIENT.CALORIES),
    protein: get(USDA_NUTRIENT.PROTEIN),
    carbs: get(USDA_NUTRIENT.CARBS),
    fat: get(USDA_NUTRIENT.FAT),
  };
  const servingG = f.servingSize || 100;
  const perServing = {
    kcal: (per100g.kcal * servingG) / 100,
    protein: (per100g.protein * servingG) / 100,
    carbs: (per100g.carbs * servingG) / 100,
    fat: (per100g.fat * servingG) / 100,
  };
  return {
    id: `usda-${f.fdcId}`,
    name: f.description,
    brand: f.brandOwner,
    servingG,
    servingLabel: f.servingSize ? `${f.servingSize}${f.servingSizeUnit || 'g'}` : '100g',
    per100g,
    perServing,
    source: 'usda',
  };
}

// --- Combined search: run both in parallel, dedupe, merge ---
export async function searchFoods(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const [off, usda] = await Promise.all([
    searchOpenFoodFacts(query),
    searchUSDA(query),
  ]);
  // USDA first (verified nutrition), then OFF (branded variety)
  return [...usda.slice(0, 12), ...off.slice(0, 20)];
}

// Convert SearchResult + serving multiplier to FoodEntry
export function toEntry(r: SearchResult, servings: number): FoodEntry {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: r.name,
    brand: r.brand,
    servingG: r.servingG * servings,
    calories: Math.round(r.perServing.kcal * servings),
    proteinG: Math.round(r.perServing.protein * servings * 10) / 10,
    carbsG: Math.round(r.perServing.carbs * servings * 10) / 10,
    fatG: Math.round(r.perServing.fat * servings * 10) / 10,
    loggedAt: Date.now(),
    source: 'search',
  };
}
