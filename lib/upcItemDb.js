// UPC Item DB free trial endpoint.
// 100 lookups/day, no API key. Returns product name + brand but USUALLY no full nutrition.
// We use it as a fallback to at least identify the product, then re-search by name
// in USDA/OFF to grab macros.
// Docs: https://www.upcitemdb.com/wp/docs/main/development/responses/

const URL = 'https://api.upcitemdb.com/prod/trial/lookup';

export async function lookupUpcItemDb(code) {
  if (!code) return null;
  try {
    const res = await fetch(`${URL}?upc=${encodeURIComponent(code)}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const item = (data.items || [])[0];
    if (!item) return null;
    return {
      code: item.upc || item.ean || code,
      name: item.title || 'Unknown product',
      brand: item.brand || '',
      category: item.category || '',
    };
  } catch (_) {
    return null;
  }
}
