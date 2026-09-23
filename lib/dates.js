// Local calendar dates as "YYYY-MM-DD".
//
// The app used to key days with toISOString(), which is UTC. In Texas that
// made the day flip at 7pm, so dinner landed on tomorrow. Anything that
// thinks in days goes through these helpers instead.

export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysKey(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

// Whole days from a to b (b later is positive).
export function daysBetween(aKey, bKey) {
  return Math.round((keyToDate(bKey) - keyToDate(aKey)) / 86400000);
}

// The last n day keys, oldest first, ending on endKey.
export function lastNDays(n, endKey = localDateKey()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDaysKey(endKey, -i));
  return out;
}

// "Mon", "Tue"... for chart labels.
export function weekdayShort(key) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][keyToDate(key).getDay()];
}

// "Sep 23" for history rows.
export function monthDay(key) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = keyToDate(key);
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

// "23:30" -> minutes past midnight.
export function hmToMinutes(hm) {
  const [h, m] = String(hm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToHm(total) {
  const t = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

// "23:30" -> "11:30 PM".
export function hm12(hm) {
  const t = hmToMinutes(hm);
  const h = Math.floor(t / 60);
  const m = String(t % 60).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}
