const { average, entriesSince, todaysEntries, summarize, formatSummary } =
  require('../src/Stats.js');

const at = (iso) => new Date(iso);

describe('average', () => {
  test('computes the mean (decimals ok)', () => {
    expect(average([{ mood: 3 }, { mood: 4 }])).toBe(3.5);
  });
  test('null on empty', () => {
    expect(average([])).toBeNull();
    expect(average(null)).toBeNull();
  });
  test('ignores non-numeric moods', () => {
    expect(average([{ mood: 'x' }, { mood: 2 }])).toBe(2);
  });
});

describe('summarize', () => {
  const now = at('2026-09-11T20:00:00');
  const entries = [
    { timestamp: at('2026-09-11T09:00:00'), mood: 3 },   // today
    { timestamp: at('2026-09-11T14:00:00'), mood: 4 },   // today
    { timestamp: at('2026-09-06T10:00:00'), mood: 2 },   // within 7 days
    { timestamp: at('2026-08-01T10:00:00'), mood: 1 }    // old
  ];

  test('today count + average', () => {
    const s = summarize(entries, now);
    expect(s.todayCount).toBe(2);
    expect(s.todayAvg).toBe(3.5);
  });

  test('7-day window', () => {
    const s = summarize(entries, now);
    expect(s.weekCount).toBe(3);
    expect(s.weekAvg).toBe(3); // (3 + 4 + 2) / 3
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
      { timestamp: at('2026-09-11T00:00:00'), mood: 5 },
      { timestamp: at('2026-09-01T00:00:00'), mood: 5 }
    ];
    const since = at('2026-09-06T00:00:00').getTime();
    expect(entriesSince(rows, since)).toHaveLength(1);
  });
});

describe('formatSummary', () => {
  test('renders averages and counts', () => {
    const msg = formatSummary({
      count: 4, todayCount: 2, todayAvg: 3.5, weekCount: 3, weekAvg: 3
    });
    expect(msg).toMatch(/Today: 3\.5 \(2 entries\)/);
    expect(msg).toMatch(/Last 7 days: 3\.0 \(3\)/);
    expect(msg).toMatch(/Total logged: 4/);
  });

  test('shows em-dash when no data', () => {
    const msg = formatSummary({
      count: 0, todayCount: 0, todayAvg: null, weekCount: 0, weekAvg: null
    });
    expect(msg).toMatch(/Today: — \(0 entries\)/);
  });
});
