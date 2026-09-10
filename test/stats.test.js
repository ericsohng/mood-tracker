const { average, entriesSince, todaysEntries, summarize, formatSummary } =
  require('../src/Stats.js');

const at = (iso) => new Date(iso);

describe('average', () => {
  test('computes the mean', () => {
    expect(average([{ mood: 6 }, { mood: 8 }])).toBe(7);
  });
  test('null on empty', () => {
    expect(average([])).toBeNull();
    expect(average(null)).toBeNull();
  });
  test('ignores non-numeric moods', () => {
    expect(average([{ mood: 'x' }, { mood: 4 }])).toBe(4);
  });
});

describe('summarize', () => {
  const now = at('2026-09-10T20:00:00');
  const entries = [
    { timestamp: at('2026-09-10T09:00:00'), mood: 6 }, // today
    { timestamp: at('2026-09-10T14:00:00'), mood: 8 }, // today
    { timestamp: at('2026-09-05T10:00:00'), mood: 4 }, // within 7 days
    { timestamp: at('2026-08-01T10:00:00'), mood: 2 }  // old
  ];

  test('today count + average', () => {
    const s = summarize(entries, now);
    expect(s.todayCount).toBe(2);
    expect(s.todayAvg).toBe(7);
  });

  test('7-day window', () => {
    const s = summarize(entries, now);
    expect(s.weekCount).toBe(3);
    expect(s.weekAvg).toBe(6); // (6 + 8 + 4) / 3
  });

  test('total count', () => {
    expect(summarize(entries, now).count).toBe(4);
  });

  test('handles no entries', () => {
    const s = summarize([], now);
    expect(s.count).toBe(0);
    expect(s.todayAvg).toBeNull();
    expect(s.weekAvg).toBeNull();
  });
});

describe('entriesSince', () => {
  test('filters by millis threshold', () => {
    const rows = [
      { timestamp: at('2026-09-10T00:00:00'), mood: 5 },
      { timestamp: at('2026-09-01T00:00:00'), mood: 5 }
    ];
    const since = at('2026-09-05T00:00:00').getTime();
    expect(entriesSince(rows, since)).toHaveLength(1);
  });
});

describe('formatSummary', () => {
  test('renders averages and counts', () => {
    const msg = formatSummary({
      count: 4, todayCount: 2, todayAvg: 7, weekCount: 3, weekAvg: 6
    });
    expect(msg).toMatch(/Today: 7\.0 \(2 entries\)/);
    expect(msg).toMatch(/Last 7 days: 6\.0 \(3\)/);
    expect(msg).toMatch(/Total logged: 4/);
  });

  test('shows em-dash when no data', () => {
    const msg = formatSummary({
      count: 0, todayCount: 0, todayAvg: null, weekCount: 0, weekAvg: null
    });
    expect(msg).toMatch(/Today: — \(0 entries\)/);
  });
});
