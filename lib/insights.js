// Insights engine: turns the food, sleep, workout and weight logs into
// feedback. Pure functions over store state, no UI.
//
// Three rules keep the feedback honest:
//   1. Every insight states its evidence in numbers from the logs.
//   2. Nothing speaks until there is enough data (MIN_DAYS), so two data
//      points never become a "pattern".
//   3. Thresholds come from published guidance:
//        sleep     AASM consensus: 8 to 10 h for ages 13 to 18, 7 to 9 h adults
//        protein   the app's goal (about 1 g per lb of bodyweight for training)
//        sodium    2300 mg a day (Dietary Guidelines for Americans)
//        per meal  20 to 40 g of protein per meal supports muscle building
//        training  3+ sessions a week for steady strength progress
//        weight    about 0.5 to 1 lb a week for a lean gain
// Cross-domain patterns are reported as "in your logs", never as cause.

import { localDateKey, lastNDays, addDaysKey, keyToDate, daysBetween, hmToMinutes } from './dates';

const MIN_DAYS = 3;

const MICRO_INFO = {
  potassium: { label: 'Potassium', unit: 'mg', sources: 'potatoes, bananas, spinach, beans' },
  calcium: { label: 'Calcium', unit: 'mg', sources: 'milk, Greek yogurt, cheese, fortified soy milk' },
  iron: { label: 'Iron', unit: 'mg', sources: 'lentils, lean beef, spinach, fortified cereal' },
  vitaminC: { label: 'Vitamin C', unit: 'mg', sources: 'bell peppers, oranges, strawberries, broccoli' },
  vitaminA: { label: 'Vitamin A', unit: 'mcg', sources: 'sweet potato, carrots, spinach' },
  vitaminD: { label: 'Vitamin D', unit: 'mcg', sources: 'salmon, milk, eggs, and sunlight' },
};

const PROTEIN_IDEAS = 'Greek yogurt (22g a cup), chicken breast (53g), '
  + 'Core Power Elite (42g a bottle), a Huel Black scoop (20g), lentils (18g a cup)';

// --- small math -------------------------------------------------------------
const sum = (a) => a.reduce((s, x) => s + x, 0);
const avg = (a) => (a.length ? sum(a) / a.length : 0);
const round = (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const pct = (x) => `${Math.round(x * 100)}%`;
function sd(a) {
  if (a.length < 2) return 0;
  const m = avg(a);
  return Math.sqrt(avg(a.map((x) => (x - m) ** 2)));
}

export function sleepTarget(age) {
  if (age && age <= 12) return { min: 9, max: 12, label: '9 to 12 hours for ages 6 to 12' };
  if (age && age >= 19) return { min: 7, max: 9, label: '7 to 9 hours for adults' };
  return { min: 8, max: 10, label: '8 to 10 hours for ages 13 to 18' };
}

// Bedtimes straddle midnight, so 23:30 and 00:30 are an hour apart, not 23.
// Times before noon count as "after midnight" by adding a day.
function bedtimeMinutes(hm) {
  const m = hmToMinutes(hm);
  return m < 720 ? m + 1440 : m;
}

// Weight moved in a session: sets x reps x kg.
function workoutVolume(session) {
  return sum((session.completedSets || []).map((s) => (s.actualReps || 0) * (s.actualWeightKg || 0)));
}

// --- assembling the days ------------------------------------------------------
export function buildDayIndex(state) {
  const food = new Map();
  for (const d of state.macroHistory || []) food.set(d.date, d);
  const t = state.today;
  if (t && t.entries && t.entries.length) food.set(t.date, t);

  const sleep = new Map();
  for (const n of state.sleepLog || []) sleep.set(n.date, n);

  const workouts = new Map();
  for (const w of state.workoutLog || []) {
    const k = localDateKey(new Date(w.date));
    if (!workouts.has(k)) workouts.set(k, []);
    workouts.get(k).push(w);
  }
  return { food, sleep, workouts };
}

// A finished day carries the goals that applied then; today uses the current ones.
function goalsFor(day, current) {
  return { ...current, ...(day && day.goals ? day.goals : {}) };
}

// --- charts -------------------------------------------------------------------
export function buildSeries(state, n = 14) {
  const idx = buildDayIndex(state);
  const keys = lastNDays(n);
  const calories = keys.map((k) => {
    const d = idx.food.get(k);
    return { date: k, value: d ? d.calories : null, goal: goalsFor(d, state.goals).calories };
  });
  const protein = keys.map((k) => {
    const d = idx.food.get(k);
    return { date: k, value: d ? d.protein : null, goal: goalsFor(d, state.goals).protein };
  });
  const sleep = keys.map((k) => ({ date: k, value: idx.sleep.get(k)?.hours ?? null }));

  // Sessions per week for the last 6 weeks, each week ending on today's weekday.
  const today = localDateKey();
  const workoutsPerWeek = [];
  for (let w = 5; w >= 0; w--) {
    const days = lastNDays(7, addDaysKey(today, -7 * w));
    workoutsPerWeek.push({ date: days[6], value: sum(days.map((k) => (idx.workouts.get(k) || []).length)) });
  }

  const weight = (state.weights || [])
    .filter((w) => daysBetween(w.date, today) <= 60)
    .map((w) => ({ date: w.date, value: round(w.weightKg * 2.2046, 1) }));

  return { calories, protein, sleep, sleepTarget: sleepTarget(state.profile?.age), workoutsPerWeek, weight };
}

// --- history: every finished day plus today, newest first ------------------------
export function buildHistory(state) {
  const idx = buildDayIndex(state);
  return [...idx.food.values()]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((d) => ({ ...d, goals: goalsFor(d, state.goals) }));
}

// --- the insights ---------------------------------------------------------------
export function buildInsights(state) {
  const out = [];
  const add = (area, tone, title, detail, action) => out.push({ area, tone, title, detail, action });
  const idx = buildDayIndex(state);
  const goals = state.goals || {};
  const profile = state.profile || {};
  const today = localDateKey();
  const week = lastNDays(7);
  const month = lastNDays(30);
  // Component scores, each 0 to 100, or null when there is not enough data.
  const score = { nutrition: null, sleep: null, training: 0, logging: 0 };

  // ---------- nutrition ----------
  // Only finished days count. Today is still in progress, and half a day of
  // food would drag every average down and invent a skipped breakfast.
  const foodWeek = lastNDays(7, addDaysKey(today, -1));
  const foodDays = foodWeek.map((k) => idx.food.get(k)).filter(Boolean);
  const loggedN = foodDays.length;
  const nutritionReady = loggedN >= MIN_DAYS;
  score.logging = (loggedN / 7) * 100;

  if (loggedN < 5) {
    add('Habits', 'info', `Food logged on ${loggedN} of the last 7 days`,
      'Averages use finished days you logged (today is left out until it is over), so gaps make every number below less reliable.',
      'Log at least 5 days a week, even rough entries, to sharpen these insights.');
  } else {
    add('Habits', 'good', `Food logged on ${loggedN} of the last 7 days`,
      'That is enough data for the nutrition averages below to mean something. Today is left out until it is over.', null);
  }

  if (nutritionReady) {
    const kcal = foodDays.map((d) => d.calories);
    const avgKcal = avg(kcal);
    const ratio = goals.calories ? avgKcal / goals.calories : 1;
    if (profile.goal === 'gain' && ratio < 0.9) {
      add('Nutrition', 'bad', 'Eating below your gain target',
        `You averaged ${Math.round(avgKcal)} kcal on logged days against a ${goals.calories} kcal goal (${pct(ratio)}). A gain needs a surplus.`,
        `Add about ${Math.round(goals.calories - avgKcal)} kcal a day. Two scoops of Huel Black is 400.`);
    } else if (profile.goal === 'lose' && ratio > 1.1) {
      add('Nutrition', 'warn', 'Eating above your loss target',
        `You averaged ${Math.round(avgKcal)} kcal against ${goals.calories} kcal (${pct(ratio)}).`,
        'Trim calorie-dense extras first: fries, sauces, sugary drinks.');
    } else if (Math.abs(ratio - 1) <= 0.1) {
      add('Nutrition', 'good', 'Calories on target',
        `You averaged ${Math.round(avgKcal)} kcal, ${pct(ratio)} of your ${goals.calories} kcal goal.`, null);
    } else {
      add('Nutrition', 'warn', `Calories at ${pct(ratio)} of goal`,
        `You averaged ${Math.round(avgKcal)} kcal against ${goals.calories} kcal.`,
        'Aim to land within 10 percent of the goal on most days.');
    }

    const cv = avgKcal ? sd(kcal) / avgKcal : 0;
    if (cv > 0.3 && loggedN >= 4) {
      add('Nutrition', 'warn', 'Big swings day to day',
        `Your daily calories vary by about ${pct(cv)}, from ${Math.round(Math.min(...kcal))} to ${Math.round(Math.max(...kcal))} kcal.`,
        'Steadier intake makes weight change easier to read and to control.');
    }

    const avgP = avg(foodDays.map((d) => d.protein));
    const hitDays = foodDays.filter((d) => d.protein >= goalsFor(d, goals).protein * 0.9).length;
    const pRatio = goals.protein ? avgP / goals.protein : 1;
    if (pRatio >= 0.9) {
      add('Nutrition', 'good', 'Protein on point',
        `${Math.round(avgP)}g a day on average (${pct(pRatio)} of ${goals.protein}g), close to goal on ${hitDays} of ${loggedN} days.`, null);
    } else {
      add('Nutrition', pRatio < 0.75 ? 'bad' : 'warn', `Protein short by ${Math.round(goals.protein - avgP)}g a day`,
        `${Math.round(avgP)}g a day on average against ${goals.protein}g. You got close on ${hitDays} of ${loggedN} days.`,
        `Easy adds: ${PROTEIN_IDEAS}.`);
    }

    const breakfastP = foodDays.map((d) => sum(d.entries.filter((e) => e.mealType === 'breakfast').map((e) => e.protein || 0)));
    const noBreakfast = breakfastP.filter((p) => p === 0).length;
    if (avg(breakfastP) < 20) {
      add('Nutrition', 'warn', 'Protein is back-loaded',
        `Breakfast averages ${Math.round(avg(breakfastP))}g of protein${noBreakfast ? `, and ${noBreakfast} of ${loggedN} days had no breakfast logged` : ''}. Spreading 20 to 40g across meals builds muscle better than one big dinner.`,
        'Move one protein source to the morning: eggs, Greek yogurt, or a shake.');
    }

    const fiberAvg = avg(foodDays.map((d) => d.fiber));
    if (goals.fiber && fiberAvg < goals.fiber * 0.7) {
      add('Nutrition', 'warn', `Fiber at ${Math.round(fiberAvg)}g a day`,
        `Your goal is ${goals.fiber}g. Low fiber usually means few whole plants in the day.`,
        'Beans, lentils, raspberries and oats are the fastest gains.');
    }

    const sodiumLimit = goals.sodium || 2300;
    const sodiumOver = foodDays.filter((d) => d.sodium > sodiumLimit).length;
    if (sodiumOver >= 2) {
      add('Nutrition', sodiumOver >= 4 ? 'bad' : 'warn', `Sodium over the limit on ${sodiumOver} of ${loggedN} days`,
        `The daily limit is ${sodiumLimit} mg. You averaged ${Math.round(avg(foodDays.map((d) => d.sodium)))} mg.`,
        'Fast food, instant ramen and deli meat are usually the biggest sources.');
    }

    const sugarAvg = avg(foodDays.map((d) => d.sugar));
    if (goals.sugar && sugarAvg > goals.sugar) {
      add('Nutrition', 'warn', `Sugar at ${Math.round(sugarAvg)}g a day`,
        `That is above your ${goals.sugar}g max on average.`,
        'Drinks are the usual culprit: one can of soda is 39g.');
    }

    // Micronutrient gaps: the two furthest below goal.
    const gaps = Object.keys(MICRO_INFO)
      .filter((k) => goals[k])
      .map((k) => ({ k, mean: avg(foodDays.map((d) => d[k] || 0)) }))
      .map((g) => ({ ...g, ratio: g.mean / goals[g.k] }))
      .filter((g) => g.ratio < 0.6)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 2);
    for (const g of gaps) {
      const info = MICRO_INFO[g.k];
      add('Nutrition', 'info', `${info.label} at ${pct(g.ratio)} of goal`,
        `Logged intake averages ${Math.round(g.mean)} ${info.unit} against ${goals[g.k]} ${info.unit}. Packaged food labels often leave micronutrients out, so the real number may be higher.`,
        `Good sources: ${info.sources}.`);
    }

    const snackKcal = sum(foodDays.map((d) => sum(d.entries.filter((e) => e.mealType === 'snack').map((e) => e.calories || 0))));
    const snackShare = snackKcal / Math.max(1, sum(kcal));
    if (snackShare > 0.4) {
      add('Habits', 'info', `Snacks are ${pct(snackShare)} of your calories`,
        'That is a lot of intake outside meals, which is usually lower in protein per calorie.',
        'Try turning one snack a day into a meal with a protein source.');
    }

    const isWeekend = (d) => [0, 6].includes(keyToDate(d.date).getDay());
    const weekend = foodDays.filter(isWeekend);
    const weekday = foodDays.filter((d) => !isWeekend(d));
    if (weekend.length >= 1 && weekday.length >= 3) {
      const diff = avg(weekend.map((d) => d.calories)) - avg(weekday.map((d) => d.calories));
      if (Math.abs(diff) >= 400) {
        add('Habits', 'info', `Weekends run ${Math.round(Math.abs(diff))} kcal ${diff > 0 ? 'higher' : 'lower'}`,
          `Weekend days average ${Math.round(avg(weekend.map((d) => d.calories)))} kcal, weekdays ${Math.round(avg(weekday.map((d) => d.calories)))}.`,
          'Plan weekend meals ahead so the whole week stays on target.');
      }
    }

    score.nutrition = (clamp(100 - Math.abs(ratio - 1) * 200, 0, 100) + clamp(pRatio, 0, 1) * 100) / 2;
  }

  // ---------- sleep ----------
  const target = sleepTarget(profile.age);
  const nights = week.map((k) => idx.sleep.get(k)).filter(Boolean);
  if (nights.length < MIN_DAYS) {
    add('Sleep', 'info', `Sleep logged ${nights.length} of the last 7 nights`,
      `Log at least ${MIN_DAYS} nights to see sleep insights. Your target is ${target.label}.`,
      'Open the Sleep tab each morning. It takes five seconds.');
  } else {
    const avgH = avg(nights.map((n) => n.hours));
    const short = nights.filter((n) => n.hours < target.min).length;
    const debt = sum(nights.map((n) => Math.max(0, target.min - n.hours)));
    if (avgH >= target.min) {
      add('Sleep', 'good', `Averaging ${round(avgH, 1)} hours`, `That meets the target of ${target.label}.`, null);
    } else {
      add('Sleep', avgH < target.min - 1 ? 'bad' : 'warn', `Averaging ${round(avgH, 1)} hours, under target`,
        `The target is ${target.label}. ${short} of ${nights.length} nights fell short, adding up to ${round(debt, 1)} hours of sleep debt this week.`,
        'Moving bedtime 30 minutes earlier is the most reliable fix.');
    }

    const bedSd = sd(nights.map((n) => bedtimeMinutes(n.bedtime)));
    if (nights.length >= 4 && bedSd > 60) {
      add('Sleep', 'warn', 'Irregular bedtime',
        `Your bedtime shifts by about ${Math.round(bedSd)} minutes night to night. An irregular schedule hurts sleep quality even when the hours look fine.`,
        'Pick a bedtime and hold it within 30 minutes, weekends included.');
    } else if (nights.length >= 4 && bedSd <= 30) {
      add('Sleep', 'good', 'Consistent bedtime',
        `Your bedtime varies by only about ${Math.round(bedSd)} minutes. That consistency supports deeper sleep.`, null);
    }

    const rated = nights.filter((n) => n.quality);
    const fullQ = rated.filter((n) => n.hours >= target.min).map((n) => n.quality);
    const shortQ = rated.filter((n) => n.hours < target.min).map((n) => n.quality);
    if (fullQ.length >= 2 && shortQ.length >= 2 && avg(fullQ) - avg(shortQ) >= 0.8) {
      add('Patterns', 'info', 'You rate full nights noticeably better',
        `In your logs, nights that reached ${target.min} hours scored ${round(avg(fullQ), 1)} out of 5 for quality, against ${round(avg(shortQ), 1)} for short nights.`,
        null);
    }

    const consistency = nights.length >= 4 ? clamp(100 - (bedSd - 30) * (100 / 90), 0, 100) : 100;
    // Each hour under target costs half the hours score, so 7.4 h against an
    // 8 h target reads as 70, not a flattering 93.
    const hoursScore = clamp(1 - (target.min - avgH) / 2, 0, 1) * 100;
    score.sleep = hoursScore * 0.7 + consistency * 0.3;
  }

  // ---------- training ----------
  const sessionsIn = (keys) => sum(keys.map((k) => (idx.workouts.get(k) || []).length));
  const sessions7 = sessionsIn(week);
  const sessions30 = sessionsIn(month);
  const workoutDays = [...idx.workouts.keys()].sort();
  const lastWorkout = workoutDays[workoutDays.length - 1];

  if (!lastWorkout) {
    add('Training', 'info', 'No workouts logged yet',
      'Finish a workout in the Gym tab and it will show up here.', null);
  } else if (sessions7 >= 3) {
    add('Training', 'good', `${sessions7} sessions this week`,
      `${sessions30} in the last 30 days. Three or more a week is the range where strength keeps climbing.`, null);
  } else {
    const since = daysBetween(lastWorkout, today);
    add('Training', sessions7 === 0 ? 'bad' : 'warn', `${sessions7} session${sessions7 === 1 ? '' : 's'} this week`,
      `Your last workout was ${since === 0 ? 'today' : `${since} day${since === 1 ? '' : 's'} ago`}, with ${sessions30} in the last 30 days.`,
      'Book three fixed training days and treat them like class.');
  }
  if (sessions7 >= 7) {
    add('Training', 'warn', 'No rest day this week',
      'Muscle grows during recovery, not during the session itself.',
      'Take at least one full rest day a week.');
  }

  if (lastWorkout) {
    const volNow = sum(week.flatMap((k) => (idx.workouts.get(k) || []).map(workoutVolume)));
    const prevWeek = lastNDays(7, addDaysKey(week[0], -1));
    const volPrev = sum(prevWeek.flatMap((k) => (idx.workouts.get(k) || []).map(workoutVolume)));
    if (volNow > 0 && volPrev > 0) {
      const change = volNow / volPrev - 1;
      add('Training', change >= 0 ? 'good' : 'info', `Training volume ${change >= 0 ? 'up' : 'down'} ${pct(Math.abs(change))}`,
        `${Math.round(volNow * 2.2046).toLocaleString()} lb moved this week (sets x reps x weight), against ${Math.round(volPrev * 2.2046).toLocaleString()} lb last week.`,
        change < -0.2 ? 'A planned deload is fine; an accidental one is worth fixing.' : null);
    }
  }
  score.training = clamp(sessions7 / 3, 0, 1) * 100;

  // ---------- cross-domain patterns ----------
  if (nutritionReady && lastWorkout) {
    const trainP = foodDays.filter((d) => idx.workouts.has(d.date)).map((d) => d.protein);
    const restP = foodDays.filter((d) => !idx.workouts.has(d.date)).map((d) => d.protein);
    if (trainP.length >= 2 && restP.length >= 2) {
      const diff = avg(trainP) - avg(restP);
      if (Math.abs(diff) >= 15) {
        add('Patterns', 'info', `Protein ${diff > 0 ? 'higher' : 'lower'} on training days`,
          `In your logs, training days average ${Math.round(avg(trainP))}g of protein and rest days ${Math.round(avg(restP))}g.`,
          diff < 0 ? 'Recovery needs protein on training days most of all.' : 'Rest days still repair muscle, so keep protein up then too.');
      }
    }
  }

  // A night's sleep is logged against the morning you woke, so it pairs with
  // that same day's food.
  const paired = month.filter((k) => k !== today)
    .map((k) => ({ night: idx.sleep.get(k), food: idx.food.get(k) }))
    .filter((p) => p.night && p.food);
  const afterShort = paired.filter((p) => p.night.hours < target.min).map((p) => p.food.calories);
  const afterFull = paired.filter((p) => p.night.hours >= target.min).map((p) => p.food.calories);
  if (afterShort.length >= MIN_DAYS && afterFull.length >= MIN_DAYS) {
    const diff = avg(afterShort) - avg(afterFull);
    if (Math.abs(diff) >= 150) {
      add('Patterns', 'info', `You eat ${Math.round(Math.abs(diff))} kcal ${diff > 0 ? 'more' : 'less'} after short nights`,
        `In your logs, days after under ${target.min} hours of sleep average ${Math.round(avg(afterShort))} kcal, against ${Math.round(avg(afterFull))} after a full night. Short sleep is known to raise appetite.`,
        diff > 0 ? 'On tired days, plan meals ahead instead of grazing.' : null);
    }
  }

  const trainNights = month.filter((k) => idx.workouts.has(k) && idx.sleep.has(k)).map((k) => idx.sleep.get(k).hours);
  const restNights = month.filter((k) => !idx.workouts.has(k) && idx.sleep.has(k)).map((k) => idx.sleep.get(k).hours);
  if (trainNights.length >= MIN_DAYS && restNights.length >= MIN_DAYS) {
    const diff = avg(trainNights) - avg(restNights);
    if (Math.abs(diff) >= 0.5) {
      add('Patterns', 'info', `You train more after ${diff > 0 ? 'longer' : 'shorter'} nights`,
        `In your logs, you slept ${round(avg(trainNights), 1)} hours before training days and ${round(avg(restNights), 1)} before rest days.`,
        diff > 0 ? 'Protecting sleep may be the easiest way to protect training days.' : null);
    }
  }

  // ---------- body ----------
  const recent = (state.weights || []).filter((w) => daysBetween(w.date, today) <= 30);
  if (recent.length >= 3 && daysBetween(recent[0].date, recent[recent.length - 1].date) >= 7) {
    // Least-squares slope, so one heavy morning does not swing the trend.
    const xs = recent.map((w) => daysBetween(recent[0].date, w.date));
    const ys = recent.map((w) => w.weightKg);
    const mx = avg(xs);
    const my = avg(ys);
    const slope = sum(xs.map((x, i) => (x - mx) * (ys[i] - my))) / Math.max(1e-9, sum(xs.map((x) => (x - mx) ** 2)));
    const perWeekLb = slope * 7 * 2.2046;
    const dir = perWeekLb > 0.1 ? 'rising' : perWeekLb < -0.1 ? 'falling' : 'holding steady';
    const lbText = `${perWeekLb > 0 ? '+' : ''}${round(perWeekLb, 2)} lb a week`;
    if (profile.goal === 'gain' && perWeekLb < 0.25) {
      add('Body', 'warn', `Weight is ${dir} (${lbText})`,
        `A lean gain runs about 0.5 to 1 lb a week. The trend across ${recent.length} weigh-ins says you are not there yet.`,
        'Add 200 to 300 kcal a day and recheck in two weeks.');
    } else if (profile.goal === 'gain' && perWeekLb > 1.3) {
      add('Body', 'warn', `Gaining fast (${lbText})`,
        'Above about 1 lb a week, more of the gain tends to be fat rather than muscle.',
        'Pull back 150 to 250 kcal a day.');
    } else if (profile.goal === 'gain') {
      add('Body', 'good', `Gaining at a lean pace (${lbText})`,
        'That is right in the 0.5 to 1 lb a week range for building muscle.', null);
    } else {
      add('Body', 'info', `Weight is ${dir} (${lbText})`,
        `Trend fitted across ${recent.length} weigh-ins over the last 30 days.`, null);
    }
  } else {
    add('Body', 'info', 'Not enough weigh-ins for a trend',
      'You need 3 or more weigh-ins spread over at least a week.',
      'Weigh in 2 or 3 mornings a week, under the same conditions each time.');
  }

  // ---------- overall ----------
  // Logging on its own is not fitness, so it carries the least weight.
  // Missing components drop out and the rest are re-weighted.
  const WEIGHTS = { nutrition: 0.35, sleep: 0.3, training: 0.25, logging: 0.1 };
  const ready = Object.entries(score).filter(([, v]) => v !== null);
  const weightSum = sum(ready.map(([k]) => WEIGHTS[k]));
  const overall = Math.round(sum(ready.map(([k, v]) => v * WEIGHTS[k])) / weightSum);
  const components = Object.fromEntries(Object.entries(score).map(([k, v]) => [k, v === null ? null : Math.round(v)]));
  const order = { bad: 0, warn: 1, info: 2, good: 3 };
  out.sort((a, b) => order[a.tone] - order[b.tone]);
  return { insights: out, overall, components, loggedDays: loggedN };
}
