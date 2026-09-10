const { parseMoodMessage, parseCommand } = require('../src/Parser.js');

describe('parseMoodMessage', () => {
  test('bare number', () => {
    expect(parseMoodMessage('7')).toEqual({ mood: 7, notes: '' });
  });

  test('number with notes', () => {
    expect(parseMoodMessage('7 slept badly')).toEqual({ mood: 7, notes: 'slept badly' });
  });

  test('comma separator', () => {
    expect(parseMoodMessage('8, tired')).toEqual({ mood: 8, notes: 'tired' });
  });

  test('dash separator', () => {
    expect(parseMoodMessage('6 - meh')).toEqual({ mood: 6, notes: 'meh' });
  });

  test('surrounding whitespace and newlines', () => {
    expect(parseMoodMessage('  10   great day ')).toEqual({ mood: 10, notes: 'great day' });
    expect(parseMoodMessage('9\ngood sleep')).toEqual({ mood: 9, notes: 'good sleep' });
  });

  test('boundaries 1 and 10 are valid', () => {
    expect(parseMoodMessage('1')).toEqual({ mood: 1, notes: '' });
    expect(parseMoodMessage('10')).toEqual({ mood: 10, notes: '' });
  });

  test('out of range', () => {
    expect(parseMoodMessage('0').error).toMatch(/out of range/);
    expect(parseMoodMessage('11').error).toMatch(/out of range/);
    expect(parseMoodMessage('-3').error).toMatch(/out of range/);
  });

  test('non-whole numbers rejected', () => {
    expect(parseMoodMessage('7.5').error).toMatch(/whole number/);
  });

  test('non-numeric rejected', () => {
    expect(parseMoodMessage('abc').error).toBeDefined();
    expect(parseMoodMessage('7abc').error).toBeDefined();
  });

  test('empty / null rejected', () => {
    expect(parseMoodMessage('').error).toBeDefined();
    expect(parseMoodMessage('   ').error).toBeDefined();
    expect(parseMoodMessage(null).error).toBeDefined();
    expect(parseMoodMessage(undefined).error).toBeDefined();
  });
});

describe('parseCommand', () => {
  test('detects commands (case-insensitive, ignores @botname)', () => {
    expect(parseCommand('/stats')).toBe('stats');
    expect(parseCommand('/help')).toBe('help');
    expect(parseCommand('/Start')).toBe('start');
    expect(parseCommand('/stats@MyMoodBot')).toBe('stats');
  });

  test('non-commands return null', () => {
    expect(parseCommand('7')).toBeNull();
    expect(parseCommand('hello')).toBeNull();
    expect(parseCommand('')).toBeNull();
    expect(parseCommand(null)).toBeNull();
  });
});
