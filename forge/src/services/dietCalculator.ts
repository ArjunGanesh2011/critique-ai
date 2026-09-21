// Mifflin-St Jeor BMR + goal-aware macros.
// This is the same formula MyFitnessPal, Cronometer, and registered dietitians use.

import type { UserProfile, Goal, Experience, BodyType } from '@/store/gameStore';

export function calcBMR(sex: 'male' | 'female', kg: number, cm: number, age: number) {
  // Mifflin-St Jeor
  return sex === 'male'
    ? 10 * kg + 6.25 * cm - 5 * age + 5
    : 10 * kg + 6.25 * cm - 5 * age - 161;
}

export function calcTDEE(bmr: number, activity: number) {
  return Math.round(bmr * activity);
}

interface QuizAnswers {
  name: string;
  age: number;
  sex: 'male' | 'female';
  heightCm: number;
  weightKg: number;
  bodyType: BodyType;
  experience: Experience;
  goal: Goal;
  workoutsPerWeek: number;
  dietaryRestrictions: string[];
}

export function curateProfile(a: QuizAnswers): UserProfile {
  // Activity factor based on workouts/week
  const activity =
    a.workoutsPerWeek <= 1 ? 1.2 :
    a.workoutsPerWeek <= 3 ? 1.375 :
    a.workoutsPerWeek <= 5 ? 1.55 :
    a.workoutsPerWeek <= 6 ? 1.725 : 1.9;

  const bmr = calcBMR(a.sex, a.weightKg, a.heightCm, a.age);
  const tdee = calcTDEE(bmr, activity);

  // Calorie target by goal
  // Skinny-fat recomp: maintenance with slight deficit + high protein
  let calories = tdee;
  if (a.goal === 'cut') calories = Math.round(tdee * 0.80);
  if (a.goal === 'bulk') calories = Math.round(tdee * 1.12);
  if (a.goal === 'recomp') calories = Math.round(tdee * 0.95);
  if (a.bodyType === 'skinny-fat' && a.goal === 'recomp') {
    // For skinny-fat the best protocol is high protein, modest deficit, heavy lifting
    calories = Math.round(tdee * 0.92);
  }

  // Protein: 1.0g per lb bodyweight (~2.2g/kg) for skinny-fat recomp; 1.6-2.2g/kg otherwise
  const proteinG = Math.round(a.bodyType === 'skinny-fat' ? a.weightKg * 2.2 : a.weightKg * 1.8);

  // Fat: 25% of calories
  const fatG = Math.round((calories * 0.25) / 9);

  // Carbs: remainder
  const carbsG = Math.round((calories - proteinG * 4 - fatG * 9) / 4);

  return {
    ...a,
    activityLevel: activity,
    targetCalories: calories,
    targetProteinG: proteinG,
    targetCarbsG: Math.max(0, carbsG),
    targetFatG: fatG,
  };
}

// Honest, goal-aware diet recommendations
export function dietRecommendations(p: UserProfile): string[] {
  const recs: string[] = [];

  if (p.bodyType === 'skinny-fat') {
    recs.push('You are skinny-fat. The winning protocol: heavy compound lifts 4x/week + slight deficit + 1g protein per lb. Cardio is optional.');
    recs.push('Prioritize whole eggs, chicken thigh, Greek yogurt, beef, fish, cottage cheese. Hit protein FIRST every meal.');
    recs.push('Eat carbs around your workouts (rice, oats, potato). Cut liquid calories — no juice, no sugary coffee, no soda.');
  }
  if (p.experience === 'beginner') {
    recs.push('Run a beginner-friendly program: 3-4 days/week, full-body or upper/lower split. Focus on squat, deadlift, bench, row, overhead press, pull-up.');
    recs.push('Sleep 7-8 hours minimum. This is non-negotiable for body recomp.');
  }
  if (p.goal === 'cut') {
    recs.push('Aggressive deficit kills muscle. We capped your deficit at 20%. Slow and steady wins recomp.');
  }
  if (p.goal === 'bulk') {
    recs.push('Lean bulk only — 12% surplus, not 30%. Excess calories just become fat. Track weekly weight; aim for 0.25-0.5kg gain/week.');
  }
  if (p.dietaryRestrictions.includes('vegetarian')) {
    recs.push('Vegetarian: lean on Greek yogurt, eggs, cottage cheese, tofu, tempeh, seitan, whey protein.');
  }
  if (p.dietaryRestrictions.includes('vegan')) {
    recs.push('Vegan: combine pea + rice protein, lean on tofu, tempeh, lentils, seitan. Hitting 2g/kg protein takes effort — track it.');
  }

  recs.push(`Daily target: ${p.targetCalories} kcal • ${p.targetProteinG}g protein • ${p.targetCarbsG}g carbs • ${p.targetFatG}g fat.`);
  return recs;
}
