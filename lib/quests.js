// Quest catalog — daily activities that reward XP.
// repeatable: true → can be tapped multiple times per day (counter shown)
// repeatable: false → one tap per day, then locked until tomorrow

export const QUESTS = [
  // === REPEATABLE QUESTS — tap as many times as you actually do them ===
  { id: 'pushups_20', title: '20 Pushups', icon: '💪', xp: 25, repeatable: true, detail: 'Quick set, anywhere. Form > speed.' },
  { id: 'pushups_40', title: '40 Pushups (big set)', icon: '🔥', xp: 60, repeatable: true, detail: 'Heavy set. Hit it in 2 if needed.' },
  { id: 'water_glass', title: 'Drink 1 glass of water', icon: '💧', xp: 10, repeatable: true, detail: '~250ml. Aim for 8 glasses today.' },
  { id: 'squats_30', title: '30 Bodyweight Squats', icon: '🦵', xp: 30, repeatable: true, detail: 'Go deep, controlled tempo.' },
  { id: 'walk_10', title: '10-minute walk', icon: '🚶', xp: 20, repeatable: true, detail: 'Outside if possible. Phone away.' },
  { id: 'protein_meal', title: 'Eat a 40g+ protein meal', icon: '🥩', xp: 40, repeatable: true, detail: 'Chicken, eggs, greek yogurt, whey.' },
  { id: 'situps_20', title: '20 Situps', icon: '🦴', xp: 20, repeatable: true, detail: 'Slow and controlled. Engage the core.' },
  { id: 'plank_60', title: '60-second plank', icon: '🧱', xp: 25, repeatable: true, detail: 'Straight body line. No sagging hips.' },
  { id: 'pullups_5', title: '5 Pullups', icon: '🪢', xp: 35, repeatable: true, detail: 'Chin over bar. Negatives count if you can\'t do full reps.' },
  { id: 'phone_break_30', title: '30 min off phone', icon: '📵', xp: 20, repeatable: true, detail: 'Put phone in another room. Real break.' },
  { id: 'read_15', title: 'Read for 15 min', icon: '📖', xp: 15, repeatable: true, detail: 'Book, article, anything not a feed.' },
  { id: 'cold_shower', title: 'Cold shower (60s)', icon: '🧊', xp: 30, repeatable: true, detail: 'End of regular shower. 60 seconds cold.' },

  // === DAILY-ONCE QUESTS — big rewards, one shot per day ===
  { id: 'stretch_5', title: '5-min stretch', icon: '🧘', xp: 25, repeatable: false, detail: 'Hips, hamstrings, shoulders. Once a day.' },
  { id: 'outside_30', title: '30+ min outside', icon: '🌳', xp: 50, repeatable: false, detail: 'Sunlight, fresh air. Even cloudy counts.' },
  { id: 'gym_session', title: 'Hit the gym', icon: '🏋️', xp: 150, repeatable: false, detail: 'Real session. 45+ min.' },
  { id: 'no_junk', title: 'No junk food today', icon: '🥗', xp: 80, repeatable: false, detail: 'Mark at end of day if true.' },
  { id: 'sleep_8', title: 'Slept 8 hours', icon: '😴', xp: 50, repeatable: false, detail: 'Log when you wake up well-rested.' },
  { id: 'meditation_10', title: '10-min meditation', icon: '🧘‍♂️', xp: 40, repeatable: false, detail: 'Headspace, Calm, or just silence.' },
  { id: 'journal', title: 'Daily journal entry', icon: '✍️', xp: 30, repeatable: false, detail: 'Even 3 sentences. Reflect.' },
];
