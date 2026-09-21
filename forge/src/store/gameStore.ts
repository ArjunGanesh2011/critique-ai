import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// XP thresholds for levels 1-10 (Critique AI's "Rankings" system)
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500];

export type Goal = 'cut' | 'recomp' | 'bulk' | 'maintain';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type BodyType = 'skinny' | 'skinny-fat' | 'average' | 'overweight' | 'muscular';

export interface UserProfile {
  name: string;
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  bodyType: BodyType;
  experience: Experience;
  goal: Goal;
  activityLevel: number; // 1.2 - 1.9
  workoutsPerWeek: number;
  dietaryRestrictions: string[];
  // Curated macros
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}

export interface FoodEntry {
  id: string;
  name: string;
  brand?: string;
  servingG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: number;
  source: 'search' | 'photo' | 'manual';
}

export interface ExerciseSet {
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
}

export interface Workout {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: number;
  completedAt?: number;
}

export interface Quest {
  id: string;
  title: string;
  desc: string;
  xp: number;
  completed: boolean;
  type: 'pushups' | 'water' | 'meal' | 'workout' | 'breathing' | 'walk' | 'sleep';
  target?: number;
}

interface GameState {
  // User
  profile: UserProfile | null;
  onboarded: boolean;

  // Gamification
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string; // ISO date

  // Daily tracking
  todaysFood: FoodEntry[];
  dailyQuests: Quest[];
  questsRefreshedDate: string;

  // Workouts
  workouts: Workout[];
  workoutHistory: Workout[];

  // History for charts
  weightHistory: { date: string; kg: number }[];
  xpHistory: { date: string; xp: number }[];

  // Actions
  hydrate: () => Promise<void>;
  setProfile: (p: UserProfile) => void;
  completeOnboarding: () => void;
  addXP: (amount: number, reason?: string) => void;
  bumpStreak: () => void;
  logFood: (entry: FoodEntry) => void;
  removeFood: (id: string) => void;
  saveWorkout: (w: Workout) => void;
  completeWorkout: (id: string) => void;
  completeQuest: (id: string) => void;
  refreshQuestsIfNeeded: () => void;
  logWeight: (kg: number) => void;
  reset: () => void;
}

const STORAGE_KEY = '@forge:state:v1';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function generateDailyQuests(): Quest[] {
  const pool: Omit<Quest, 'completed'>[] = [
    { id: 'q-pushups-20', title: 'Hourly Push-Ups', desc: 'Knock out 20 push-ups', xp: 25, type: 'pushups', target: 20 },
    { id: 'q-water-8', title: 'Hydrate', desc: 'Drink 8 glasses of water', xp: 20, type: 'water', target: 8 },
    { id: 'q-meals-log', title: 'Log Every Meal', desc: 'Track all 3 main meals today', xp: 30, type: 'meal', target: 3 },
    { id: 'q-workout', title: 'Train', desc: 'Complete one workout', xp: 50, type: 'workout' },
    { id: 'q-breathing', title: 'Reset Your Nervous System', desc: '5 min of box breathing', xp: 15, type: 'breathing' },
    { id: 'q-walk', title: 'Steps', desc: 'Hit 8,000 steps', xp: 25, type: 'walk', target: 8000 },
    { id: 'q-sleep', title: 'Recovery', desc: 'Log 7+ hours of sleep last night', xp: 20, type: 'sleep' },
  ];
  return pool.map(q => ({ ...q, completed: false }));
}

function levelForXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function progressInLevel(xp: number) {
  const lvl = levelForXP(xp);
  const floor = LEVEL_THRESHOLDS[lvl - 1] ?? 0;
  const ceil = LEVEL_THRESHOLDS[lvl] ?? floor + 1000;
  return { current: xp - floor, span: ceil - floor, pct: (xp - floor) / (ceil - floor) };
}

export const useGameStore = create<GameState>((set, get) => ({
  profile: null,
  onboarded: false,
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
  todaysFood: [],
  dailyQuests: generateDailyQuests(),
  questsRefreshedDate: todayISO(),
  workouts: [],
  workoutHistory: [],
  weightHistory: [],
  xpHistory: [],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set(parsed);
      }
    } catch (e) {
      console.warn('hydrate failed', e);
    }
    get().refreshQuestsIfNeeded();
  },

  setProfile: (p) => {
    set({ profile: p });
    persist(get());
  },

  completeOnboarding: () => {
    set({ onboarded: true });
    persist(get());
  },

  addXP: (amount) => {
    const newXP = get().xp + amount;
    const newLevel = levelForXP(newXP);
    const today = todayISO();
    const history = [...get().xpHistory];
    const existing = history.find(h => h.date === today);
    if (existing) existing.xp += amount;
    else history.push({ date: today, xp: amount });
    set({ xp: newXP, level: newLevel, xpHistory: history });
    persist(get());
  },

  bumpStreak: () => {
    const today = todayISO();
    const last = get().lastActiveDate;
    if (last === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = last === yesterday ? get().streak + 1 : 1;
    set({ streak: newStreak, lastActiveDate: today });
    persist(get());
  },

  logFood: (entry) => {
    set({ todaysFood: [...get().todaysFood, entry] });
    get().addXP(5);
    get().bumpStreak();
    persist(get());
  },

  removeFood: (id) => {
    set({ todaysFood: get().todaysFood.filter(f => f.id !== id) });
    persist(get());
  },

  saveWorkout: (w) => {
    set({ workouts: [w, ...get().workouts.filter(x => x.id !== w.id)] });
    persist(get());
  },

  completeWorkout: (id) => {
    const w = get().workouts.find(x => x.id === id);
    if (!w) return;
    const completed = { ...w, completedAt: Date.now() };
    set({
      workoutHistory: [completed, ...get().workoutHistory],
      workouts: get().workouts.filter(x => x.id !== id),
    });
    get().addXP(80);
    get().bumpStreak();
    persist(get());
  },

  completeQuest: (id) => {
    const quest = get().dailyQuests.find(q => q.id === id);
    if (!quest || quest.completed) return;
    set({
      dailyQuests: get().dailyQuests.map(q => q.id === id ? { ...q, completed: true } : q),
    });
    get().addXP(quest.xp);
    get().bumpStreak();
    persist(get());
  },

  refreshQuestsIfNeeded: () => {
    const today = todayISO();
    if (get().questsRefreshedDate !== today) {
      set({
        dailyQuests: generateDailyQuests(),
        questsRefreshedDate: today,
        todaysFood: [],
      });
      persist(get());
    }
  },

  logWeight: (kg) => {
    const today = todayISO();
    const history = get().weightHistory.filter(w => w.date !== today);
    history.push({ date: today, kg });
    set({ weightHistory: history });
    persist(get());
  },

  reset: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      profile: null,
      onboarded: false,
      xp: 0,
      level: 1,
      streak: 0,
      todaysFood: [],
      workouts: [],
      workoutHistory: [],
      weightHistory: [],
      xpHistory: [],
      dailyQuests: generateDailyQuests(),
    });
  },
}));

async function persist(state: GameState) {
  try {
    const { hydrate, setProfile, completeOnboarding, addXP, bumpStreak,
            logFood, removeFood, saveWorkout, completeWorkout, completeQuest,
            refreshQuestsIfNeeded, logWeight, reset, ...rest } = state;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch (e) {
    console.warn('persist failed', e);
  }
}

export { LEVEL_THRESHOLDS, levelForXP };
