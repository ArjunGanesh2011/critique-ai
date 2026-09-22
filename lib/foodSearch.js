// Multi-source food search aggregator.
// USDA FoodData Central (best for branded US foods) + Open Food Facts (best worldwide).
// Barcode lookup tries multiple sources + multiple barcode formats.

import { searchUsda, barcodeUsda } from './usda';
import { searchOff, barcodeOff, scaleMacros } from './openFoodFacts';
import { lookupUpcItemDb } from './upcItemDb';
import { searchLocal } from './localFoods';

export { scaleMacros };

function dedupe(items) {
  const seen = new Set();
  return items.filter((it) => {
    const key = `${(it.name || '').toLowerCase().trim()}|${(it.brand || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchFoods(query) {
  if (!query || query.trim().length < 2) return [];
  // Built-in foods come first: they are curated, they always carry a real
  // serving, and they answer instantly even when the network is slow.
  const local = searchLocal(query);
  const [usdaRes, offRes] = await Promise.allSettled([
    searchUsda(query),
    searchOff(query),
  ]);
  const usda = usdaRes.status === 'fulfilled' ? usdaRes.value : [];
  const off = offRes.status === 'fulfilled' ? offRes.value : [];
  return dedupe([...local, ...usda, ...off]);
}

// Serving-aware portion helper shared by the UI.
// Returns the grams a quantity represents in the chosen unit.
export function portionGrams(food, quantity, unit) {
  const qty = Number(quantity) || 0;
  if (unit === 'g') return qty;
  const per = food?.serving?.grams || 0;
  return qty * per;
}

// "2 scoops", "1 pouch", "1.5 cups" — the text that goes in the log entry.
export function servingText(food, quantity) {
  const s = food?.serving;
  if (!s) return `${quantity}g`;
  const qty = Number(quantity) || 0;
  const name = qty === 1 ? s.unit : s.unitPlural || s.unit + 's';
  // Trim a trailing ".0" so 2 servings never reads "2.0 scoops".
  const shown = Number.isInteger(qty) ? String(qty) : String(qty);
  return `${shown} ${name}`;
}

// UPCs come in different lengths: UPC-A (12), EAN-13 (13), UPC-E (8).
// Different DBs store them differently — try multiple formats.
function barcodeVariants(code) {
  const c = String(code).replace(/[^0-9]/g, '');
  const set = new Set();
  set.add(c);
  // strip leading zero(s)
  set.add(c.replace(/^0+/, ''));
  // pad to 13 (EAN format)
  if (c.length < 13) set.add(c.padStart(13, '0'));
  // pad to 12 (UPC-A)
  if (c.length < 12) set.add(c.padStart(12, '0'));
  // remove a leading zero if 13 digits
  if (c.length === 13 && c[0] === '0') set.add(c.slice(1));
  return [...set].filter(Boolean);
}

export async function lookupBarcode(code) {
  if (!code) return null;
  const variants = barcodeVariants(code);

  // 1) Try Open Food Facts on each variant
  for (const v of variants) {
    try {
      const r = await barcodeOff(v);
      if (r) return r;
    } catch (_) {}
  }

  // 2) Try USDA Branded on each variant
  for (const v of variants) {
    try {
      const r = await barcodeUsda(v);
      if (r) return r;
    } catch (_) {}
  }

  // 3) UPC Item DB to identify the product, then re-search by name on USDA/OFF
  for (const v of variants) {
    const ident = await lookupUpcItemDb(v);
    if (ident) {
      const searchQ = [ident.brand, ident.name].filter(Boolean).join(' ').trim();
      if (searchQ.length >= 2) {
        const matches = await searchFoods(searchQ);
        if (matches.length > 0) {
          // Return best match, attaching original barcode
          return {
            ...matches[0],
            id: 'barcode_' + v,
            // Use UPC name if it's more specific
            name: ident.name || matches[0].name,
            brand: ident.brand || matches[0].brand,
          };
        }
        // Fallback: return product info with empty macros so user can see what it is
        // and at least manually log it (or it's a starting point).
        return {
          id: 'upcitemdb_' + v,
          name: ident.name,
          brand: ident.brand,
          source: 'UPCItemDB (no macros)',
          macrosPer100g: {
            calories: 0, protein: 0, carbs: 0, fat: 0,
            sugar: 0, fiber: 0, sodium: 0, potassium: 0,
            calcium: 0, iron: 0, vitaminC: 0, vitaminA: 0, vitaminD: 0,
          },
        };
      }
    }
  }

  return null;
}
