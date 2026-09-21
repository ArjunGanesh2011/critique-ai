# Critique Fit

A Critique-AI style fitness gamification app. Track macros, snap photos of food for AI macro estimates, complete hourly quests, and level up a character from "Skinny-Fat Scrub" to "Mythic Athlete."

Built with React Native + Expo Router. Runs on your iPhone via Expo Go — no App Store, no Apple Developer account needed.

## What's in the app

- **Character tab** — Tier/level system, XP bar, daily streak, today's macro overview at a glance.
- **Macros tab** — Search Open Food Facts (~3M products), scale by grams, log entries, +5 XP per log.
- **Snap tab** — Take a photo of a meal, Claude Vision estimates the foods + macros, log with one tap.
- **Quests tab** — 10 daily quests (pushups, water, walk, gym, etc.), level-up alerts, optional hourly notifications.

State persists locally on the phone via AsyncStorage.

## Setup (one-time, ~10 minutes)

### 1. Install Node.js
If you don't have it: download the LTS from [nodejs.org](https://nodejs.org). Verify in a terminal:
```
node --version
npm --version
```

### 2. Install Expo Go on your iPhone
Search "Expo Go" in the App Store, install it. (Apple's Expo Go on iOS limits some native modules; everything in this MVP works.)

### 3. Install project dependencies
Open a terminal in this folder (`Critique AI`) and run:
```
npm install
```

### 4. Add your Anthropic API key
Get a key from [console.anthropic.com](https://console.anthropic.com). Copy `.env.example` to `.env` and paste in your key:
```
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```
Camera-to-macros will not work without this. Everything else (manual logging, quests, character) works fine without it.

### 5. Run it
```
npx expo start
```
A QR code appears in the terminal. Open the iPhone camera app, point it at the QR, tap the banner, and Expo Go loads the app. Hot reload works — edit a file, save, the app updates instantly.

## Daily-use tips

- **Quest XP scaling:** Pushups give 25 XP. Hitting the gym gives 150 XP. Sleeping 8 hours gives 50 XP. Hit Level 7 (Mythic Athlete) by stacking ~5500 XP — roughly 2-3 months of consistent grind.
- **Camera-to-macros cost:** Each photo costs ~$0.01-0.02 in Anthropic API usage. Log 3 meals/day = ~$1/month.
- **Notifications:** The hourly toggle in the Quests tab schedules a single repeating push every hour while the app is registered. Toggle off when you don't want pestering.

## File map

```
app/
  _layout.js            Root stack
  (tabs)/
    _layout.js          Bottom tab bar
    index.js            Home / Character screen
    macros.js           Macro tracker + Open Food Facts
    camera.js           Camera + Claude Vision
    quests.js           Hourly quest system

lib/
  store.js              Zustand + AsyncStorage state
  openFoodFacts.js      Food search API
  claudeVision.js       Photo → macros
  quests.js             Quest catalog

components/
  CharacterCard.js      Tier display + XP bar
  MacroBar.js           Reusable macro progress bar
```

## Tweaking it

- **Adjust macro goals:** edit `initialMacroGoals` in `lib/store.js`.
- **Add quests:** append to the array in `lib/quests.js` — id, title, icon, xp, cooldown.
- **Change tiers:** edit `TIERS` array in `lib/store.js` — add levels, rename titles, change emojis.
- **Switch to USDA / Nutritionix later:** swap the implementation in `lib/openFoodFacts.js` — the interface (`searchFoods`, `scaleMacros`) stays the same.

## Known limits of the MVP

- No barcode scanner yet (easy add — Open Food Facts has barcode lookup).
- No recipe builder.
- No multi-day history (only today is shown; data accumulates in entries log).
- Web target (`npx expo start --web`) works for most screens but camera + notifications need the phone.

## Building a real iOS app later

When you're ready to ship to the App Store, install EAS:
```
npm install -g eas-cli
eas build --platform ios
```
You'll need an Apple Developer account ($99/yr) at that point. Until then, Expo Go is plenty.

## Web app on your phone (GitHub Pages)

The same app also builds to a static website, which installs to an iPhone or
Android home screen like a normal app — no App Store, no Expo Go.

**Live site:** https://ArjunGanesh2011.github.io/critique-ai/

### Installing it on your phone

1. Open the link above in Safari (iOS) or Chrome (Android).
2. iOS: Share button then **Add to Home Screen**. Android: menu then **Install app**.
3. Launch it from the home screen. It runs full-screen with no browser chrome.

### API key

The published site is public, so **no API key is built into it**. The first time
you open the Snap or Diet tab it asks for an Anthropic key, which is stored in
that browser's local storage on your device only. Get one at
[console.anthropic.com](https://console.anthropic.com/settings/keys).

Food search uses the USDA `DEMO_KEY` on the web build (30 requests/hour). Open
Food Facts search needs no key and is unlimited.

### Deploying

Every push to `main` rebuilds and redeploys through
`.github/workflows/deploy.yml`. To build and check it locally first:

```
npm run build:web     # writes dist/
node scripts/serve-pages.js   # http://localhost:4173/critique-ai/
```

The build sets `EXPO_NO_DOTENV=1` so nothing from your local `.env` can end up
in the published bundle. If you rename the repo, update `experiments.baseUrl`
in `app.json` to match, or the site will load a blank page.

### Web limitations

- Push notifications from the Quests tab are iOS/Android-app only.
- The camera needs HTTPS, which Pages provides; on iOS, Safari only grants
  camera access to a home-screen app from iOS 16.4 up.
