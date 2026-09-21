// Global state store with AsyncStorage persistence.
// Tracks character (XP/level), profile, daily macros + micronutrients,
// quest completion, weight history, and saved workouts.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 200 levels generated programmatically. 25 distinct rank names × 8 sublevels each.
// XP curve: minXp = floor(40 * (level-1)^1.7) — gentle early, grindy later.
const RANK_NAMES = [
  'Skinny-Fat Scrub',  'Cardio Cadet',    'Iron Initiate',  'Gym Bro',
  'Lean Predator',     'Beast Mode',      'Mythic Athlete', 'Apex Lifter',
  'Titan Forger',      'Steel Spartan',   'Granite Gladiator', 'Phantom Sprinter',
  'Olympus Climber',   'Berserker Wolf',  'Iron Phoenix',   'Demigod',
  'Warlord',           'Champion',        'Conqueror',      'Living Legend',
  'Mythos',            'Cosmic Avatar',   'Titan Ascendant','Eternal Forged', 'Final Form',
];
const RANK_EMOJIS = [
  '🧍','🏃','💪','🏋️','🐺','🦍','👑','🥇','🛡️','⚔️',
  '🗿','💨','🏔️','🐉','🔥','✨','🌟','🥊','⚡','🌌',
  '🎖️','🪐','☄️','🌠','🔱',
];
const RANK_COLORS = [
  '#9ca3af','#60a5fa','#a78bfa','#34d399','#f59e0b','#ef4444','#eab308','#fb923c','#22d3ee','#f472b6',
  '#84cc16','#06b6d4','#8b5cf6','#10b981','#f97316','#fde047','#facc15','#3b82f6','#a855f7','#0ea5e9',
  '#14b8a6','#d946ef','#ec4899','#f43f5e','#fbbf24',
];
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII'];

export const TIERS = Array.from({ length: 200 }, (_, i) => {
  const level = i + 1;
  const rankIdx = Math.floor(i / 8);
  const subIdx = i % 8;
  const minXp = level === 1 ? 0 : Math.floor(40 * Math.pow(level - 1, 1.7));
  return {
    level,
    title: `${RANK_NAMES[rankIdx]} ${ROMAN[subIdx]}`,
    minXp,
    emoji: RANK_EMOJIS[rankIdx],
    color: RANK_COLORS[rankIdx],
  };
});

export function tierFromXp(xp) {
  let current = TIERS[0];
  for (const t of TIERS) if (xp >= t.minXp) current = t;
  const next = TIERS.find((t) => t.minXp > xp);
  const xpIntoLevel = xp - current.minXp;
  const xpForNext = next ? next.minXp - current.minXp : 0;
  const progress = next ? xpIntoLevel / xpForNext : 1;
  return { current, next, progress, xpIntoLevel, xpForNext };
}

const todayKey = () => new Date().toISOString().slice(0, 10);

// === Macro goals calculation ===
// Mifflin-St Jeor for BMR; multiply by activity factor; adjust for goal.
export function calcGoalsFromProfile(p) {
  if (!p || !p.weightKg || !p.heightCm || !p.age) return null;
  const w = p.weightKg, h = p.heightCm, a = p.age;
  const sex = p.sex || 'male';
  const bmr = sex === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
  const activityFactor = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  }[p.activityLevel || 'moderate'];
  let tdee = bmr * activityFactor;
  let calories;
  if (p.goal === 'lose') calories = Math.round(tdee - 500);
  else if (p.goal === 'gain') calories = Math.round(tdee + 350);
  else calories = Math.round(tdee);

  // Protein: 1.0g/lb bodyweight (= ~2.2g/kg) for muscle gain or recomp
  const proteinG = Math.round(w * 2.2);
  // Fat: 25% of calories (9 cal/g)
  const fatG = Math.round((calories * 0.25) / 9);
  // Carbs: rest of calories (4 cal/g)
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return {
    calories,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
    sugar: 50,
    fiber: 35,
    sodium: 2300,
    potassium: 3400,
    calcium: 1000,
    iron: sex === 'female' ? 18 : 11,
    vitaminC: 90,
    vitaminA: 900,
    vitaminD: 20,
  };
}

const DEFAULT_GOALS = {
  calories: 2400, protein: 180, carbs: 250, fat: 70,
  sugar: 50, fiber: 35,
  sodium: 2300, potassium: 3400, calcium: 1000, iron: 11,
  vitaminC: 90, vitaminA: 900, vitaminD: 20,
};

const NUTRIENT_XP = {
  protein: 30, fiber: 20, potassium: 15, calcium: 10, iron: 10,
  vitaminC: 10, vitaminA: 10, vitaminD: 10,
};

const initialMacrosToday = () => ({
  date: todayKey(),
  calories: 0, protein: 0, carbs: 0, fat: 0,
  sugar: 0, fiber: 0, sodium: 0, potassium: 0,
  calcium: 0, iron: 0, vitaminC: 0, vitaminA: 0, vitaminD: 0,
  entries: [],
  nutrientGoalsHit: [],
});

const initialQuestsToday = () => ({ date: todayKey(), counts: {} });

export const useStore = create(
  persist(
    (set, get) => ({
      // --- profile (filled by onboarding quiz) ---
      profileComplete: false,
      profile: {
        name: 'Arjun',
        age: null,
        sex: 'male',
        heightCm: null,
        weightKg: null,           // current weight (changes when you log)
        startWeightKg: null,      // immutable starting weight (set once at onboarding)
        goalWeightKg: null,
        goal: 'gain',
        activityLevel: 'moderate',
        dietPreferences: '',
      },
      setProfile: (patch) => {
        const next = { ...get().profile, ...patch };
        set({ profile: next });
        // auto-recompute goals when profile changes
        const newGoals = calcGoalsFromProfile(next);
        if (newGoals) set({ goals: newGoals });
      },
      completeOnboarding: () => {
        const p = get().profile;
        // Lock in starting weight immutably (only on first onboarding)
        const next = { ...p };
        if (p.weightKg && !p.startWeightKg) {
          next.startWeightKg = p.weightKg;
        }
        set({ profile: next, profileComplete: true });
        // Seed weight history with today's entry if empty
        if (next.weightKg && get().weights.length === 0) {
          set({ weights: [{ date: todayKey(), weightKg: next.weightKg }] });
        }
      },

      // --- character ---
      xp: 0,
      streak: 0,
      lastActiveDate: null,

      addXp: (amount) => {
        const beforeTier = tierFromXp(get().xp).current.level;
        const newXp = get().xp + amount;
        const afterTier = tierFromXp(newXp).current.level;
        set({ xp: newXp });
        return { leveledUp: afterTier > beforeTier, newLevel: afterTier };
      },

      checkInDaily: () => {
        const today = todayKey();
        const last = get().lastActiveDate;
        if (last === today) return;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        set({
          streak: last === yesterday ? get().streak + 1 : 1,
          lastActiveDate: today,
        });
      },

      // --- weights ---
      weights: [], // [{ date: 'YYYY-MM-DD', weightKg: number }]
      logWeight: (weightKg) => {
        const today = todayKey();
        const p = get().profile;
        // Migration: freeze startWeightKg from existing data if it was never locked in
        if (!p.startWeightKg) {
          const oldStart = get().weights[0]?.weightKg || p.weightKg;
          if (oldStart) set({ profile: { ...p, startWeightKg: oldStart } });
        }
        const list = get().weights.filter((w) => w.date !== today);
        list.push({ date: today, weightKg });
        list.sort((a, b) => a.date.localeCompare(b.date));
        set({ weights: list });
        // Note: setProfile updates current weightKg but never touches startWeightKg
        get().setProfile({ weightKg });
        get().addXp(10);
        get().checkInDaily();
      },
      startWeight: () =>
        get().profile.startWeightKg ||
        get().weights[0]?.weightKg ||
        get().profile.weightKg,
      currentWeight: () =>
        get().weights[get().weights.length - 1]?.weightKg ||
        get().profile.weightKg,

      // --- macros ---
      goals: DEFAULT_GOALS,
      setGoals: (goals) => set({ goals: { ...get().goals, ...goals } }),

      today: initialMacrosToday(),

      _rollIfNewDay: () => {
        const today = todayKey();
        if (get().today.date !== today) set({ today: initialMacrosToday() });
        const cqt = get().completedQuestsToday;
        if (cqt.date !== today) set({ completedQuestsToday: initialQuestsToday() });
      },

      _checkNutrientMilestones: () => {
        const t = get().today;
        const g = get().goals;
        const alreadyHit = t.nutrientGoalsHit || [];
        const newlyHit = [];
        let totalXp = 0;
        for (const [nutrient, xp] of Object.entries(NUTRIENT_XP)) {
          if (alreadyHit.includes(nutrient)) continue;
          const current = t[nutrient] || 0;
          const goal = g[nutrient] || 0;
          if (goal > 0 && current >= goal) {
            newlyHit.push(nutrient);
            totalXp += xp;
          }
        }
        if (newlyHit.length > 0) {
          set({ today: { ...t, nutrientGoalsHit: [...alreadyHit, ...newlyHit] } });
          get().addXp(totalXp);
        }
        return { newlyHit, totalXp };
      },

      logFood: ({
        name, calories = 0, protein = 0, carbs = 0, fat = 0,
        sugar = 0, fiber = 0, sodium = 0, potassium = 0,
        calcium = 0, iron = 0, vitaminC = 0, vitaminA = 0, vitaminD = 0,
        source = 'manual',
        mealType = 'snack', // 'breakfast' | 'lunch' | 'dinner' | 'snack'
      }) => {
        get()._rollIfNewDay();
        const t = get().today;
        const entry = {
          id: Date.now().toString(),
          name,
          mealType,
          calories: Math.round(calories), protein: Math.round(protein),
          carbs: Math.round(carbs), fat: Math.round(fat),
          sugar: Math.round(sugar), fiber: Math.round(fiber),
          sodium: Math.round(sodium), potassium: Math.round(potassium),
          calcium: Math.round(calcium), iron: Math.round(iron * 10) / 10,
          vitaminC: Math.round(vitaminC), vitaminA: Math.round(vitaminA),
          vitaminD: Math.round(vitaminD * 10) / 10,
          time: new Date().toISOString(),
          source,
        };
        set({
          today: {
            ...t,
            calories: t.calories + entry.calories,
            protein: t.protein + entry.protein,
            carbs: t.carbs + entry.carbs,
            fat: t.fat + entry.fat,
            sugar: t.sugar + entry.sugar,
            fiber: t.fiber + entry.fiber,
            sodium: t.sodium + entry.sodium,
            potassium: t.potassium + entry.potassium,
            calcium: t.calcium + entry.calcium,
            iron: t.iron + entry.iron,
            vitaminC: t.vitaminC + entry.vitaminC,
            vitaminA: t.vitaminA + entry.vitaminA,
            vitaminD: t.vitaminD + entry.vitaminD,
            entries: [entry, ...t.entries],
          },
        });
        get().addXp(5);
        get().checkInDaily();
        return get()._checkNutrientMilestones();
      },

      removeEntry: (id) => {
        const t = get().today;
        const entry = t.entries.find((e) => e.id === id);
        if (!entry) return;
        const fields = ['calories', 'protein', 'carbs', 'fat', 'sugar', 'fiber',
          'sodium', 'potassium', 'calcium', 'iron', 'vitaminC', 'vitaminA', 'vitaminD'];
        const updated = { ...t };
        for (const f of fields) updated[f] = Math.max(0, (t[f] || 0) - (entry[f] || 0));
        updated.entries = t.entries.filter((e) => e.id !== id);
        set({ today: updated });
      },

      // --- quests ---
      completedQuestsToday: initialQuestsToday(),

      completeQuest: (questId, xpReward, repeatable = false) => {
        get()._rollIfNewDay();
        const today = todayKey();
        const cqt = get().completedQuestsToday;
        const counts = cqt.date === today ? { ...cqt.counts } : {};
        const currentCount = counts[questId] || 0;
        if (!repeatable && currentCount >= 1) return false;
        counts[questId] = currentCount + 1;
        set({ completedQuestsToday: { date: today, counts } });
        get().addXp(xpReward);
        get().checkInDaily();
        return true;
      },

      questCount: (questId) => {
        const cqt = get().completedQuestsToday;
        if (cqt.date !== todayKey()) return 0;
        return cqt.counts?.[questId] || 0;
      },

      totalQuestsToday: () => {
        const cqt = get().completedQuestsToday;
        if (cqt.date !== todayKey()) return 0;
        return Object.values(cqt.counts || {}).reduce((a, b) => a + b, 0);
      },

      // --- workouts ---
      // workouts[]: { id, name, exercises: [{ exerciseId, sets: [{ reps, weightKg }] }] }
      workouts: [],
      // workoutLog[]: { id, workoutId, date, completedSets: [...], xpEarned }
      workoutLog: [],

      saveWorkout: (workout) => {
        const list = [...get().workouts];
        const idx = list.findIndex((w) => w.id === workout.id);
        if (idx >= 0) list[idx] = workout;
        else list.push({ ...workout, id: workout.id || Date.now().toString() });
        set({ workouts: list });
      },

      deleteWorkout: (id) => {
        set({ workouts: get().workouts.filter((w) => w.id !== id) });
      },

      logWorkoutSession: ({ workoutId, completedSets, durationMin }) => {
        const xp = 100 + Math.min(150, completedSets.length * 5);
        set({
          workoutLog: [
            {
              id: Date.now().toString(),
              workoutId,
              date: new Date().toISOString(),
              completedSets,
              durationMin,
              xpEarned: xp,
            },
            ...get().workoutLog,
          ],
        });
        get().addXp(xp);
        get().checkInDaily();
        return xp;
      },

      // --- diet plan (saved AI-generated plan) ---
      dietPlan: null, // { generatedAt, days: [{ name, meals: [{ name, foods, macros }] }] }
      setDietPlan: (plan) => set({ dietPlan: plan }),

      // --- Anthropic key, entered at runtime and kept on this device only ---
      // Never bundled into the build, so the public web deploy ships no secret.
      apiKey: '',
      setApiKey: (key) => set({ apiKey: (key || '').trim() }),

      // --- danger zone ---
      resetAll: () =>
        set({
          xp: 0, streak: 0, lastActiveDate: null,
          today: initialMacrosToday(),
          completedQuestsToday: initialQuestsToday(),
          weights: [],
          workouts: [],
          workoutLog: [],
          dietPlan: null,
          profileComplete: false,
          // Wipe profile back to defaults so re-onboarding starts truly fresh.
          profile: {
            name: 'Arjun',
            age: null,
            sex: 'male',
            heightCm: null,
            weightKg: null,
            startWeightKg: null,
            goalWeightKg: null,
            goal: 'gain',
            activityLevel: 'moderate',
            dietPreferences: '',
          },
          goals: DEFAULT_GOALS,
        }),
    }),
    {
      name: 'critique-fit-storage-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
