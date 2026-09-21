// =============================================================================
// CONFIG — drop your API keys here. Do NOT commit this file once you add them.
// =============================================================================

// Anthropic (Claude) — powers photo-to-macros, outfit/physique/posture analysis,
// and the general AI assistant. Get a key at https://console.anthropic.com/.
//
// SECURITY NOTE: shipping an API key inside a mobile app is a bad idea for
// production — anyone can extract it. For real launches, route AI calls through
// your own backend (Vercel function, Cloudflare Worker, anything). For personal
// use / testing on your own device, dropping it here is fine.
export const ANTHROPIC_API_KEY = '';

// USDA FoodData Central — free, sign up at https://fdc.nal.usda.gov/api-key-signup.html
// Leave blank to use DEMO_KEY (heavily rate-limited but works).
export const USDA_API_KEY = '';

// Anthropic model. claude-haiku-4-5 is cheap+fast for food photos, claude-sonnet-4-6
// is smarter for physique/posture analysis.
export const VISION_MODEL = 'claude-haiku-4-5-20251001';
export const CHAT_MODEL = 'claude-sonnet-4-6';
