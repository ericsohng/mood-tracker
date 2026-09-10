/**
 * Pure stats + formatting helpers. No Google APIs, unit-tested with Jest
 * (see test/stats.test.js). Entries are plain objects of the shape
 * { timestamp: Date|string|number, mood: number }.
 */

function toDate_(v) {
  return v instanceof Date ? v : new Date(v);
}

/**
 * Mean of the mood values, or null if there are none.
 * @param {Array<{mood:*}>} entries
 * @return {number|null}
 */
function average(entries) {
  var moods = (entries || [])
    .map(function (e) { return Number(e.mood); })
    .filter(function (m) { return Number.isFinite(m); });
  if (!moods.length) return null;
  var sum = moods.reduce(function (a, b) { return a + b; }, 0);
  return sum / moods.length;
}

/**
 * Entries whose timestamp is at or after `sinceMillis`.
 */
function entriesSince(entries, sinceMillis) {
  return (entries || []).filter(function (e) {
    var t = toDate_(e.timestamp).getTime();
    return Number.isFinite(t) && t >= sinceMillis;
  });
}

function isSameLocalDay_(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/**
 * Entries that fall on the same local calendar day as `now`.
 */
function todaysEntries(entries, now) {
  var ref = toDate_(now);
  return (entries || []).filter(function (e) {
    return isSameLocalDay_(toDate_(e.timestamp), ref);
  });
}

/**
 * Summary object used by the /stats reply.
 * @return {{count:number, todayCount:number, todayAvg:number|null,
 *           weekCount:number, weekAvg:number|null}}
 */
function summarize(entries, now) {
  var ref = toDate_(now);
  var weekAgo = ref.getTime() - 7 * 24 * 60 * 60 * 1000;
  var week = entriesSince(entries, weekAgo);
  var today = todaysEntries(entries, ref);
  return {
    count: (entries || []).length,
    todayCount: today.length,
    todayAvg: average(today),
    weekCount: week.length,
    weekAvg: average(week)
  };
}

function fmtAvg_(v) {
  return v === null ? '—' : (Math.round(v * 10) / 10).toFixed(1);
}

/**
 * Human-readable summary for a Telegram reply.
 */
function formatSummary(summary) {
  return [
    '📊 Mood summary',
    'Today: ' + fmtAvg_(summary.todayAvg) +
      ' (' + summary.todayCount + ' entr' + (summary.todayCount === 1 ? 'y' : 'ies') + ')',
    'Last 7 days: ' + fmtAvg_(summary.weekAvg) + ' (' + summary.weekCount + ')',
    'Total logged: ' + summary.count
  ].join('\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    average: average,
    entriesSince: entriesSince,
    todaysEntries: todaysEntries,
    summarize: summarize,
    formatSummary: formatSummary
  };
}
