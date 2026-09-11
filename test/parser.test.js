const { parseMoodMessage, parseCommand } = require('../src/Parser.js');

describe('parseMoodMessage', () => {
  test('bare integer', () => {
    expect(parseMoodMessage('3')).toEqual({ mood: 3, notes: '' });
  });

  test('one decimal', () => {
    expect(parseMoodMessage('3.5')).toEqual({ mood: 3.5, notes: '' });
  });

  test('decimal with notes', () => {
    expect(parseMoodMessage('4.5 slept badly')).toEqual({ mood: 4.5, notes: 'slept badly' });
  });

  test('comma separator', () => {
    expect(parseMoodMessage('2, tired')).toEqual({ mood: 2, notes: 'tired' });
  });

  test('dash separator', () => {
    expect(parseMoodMessage('3 - meh')).toEqual({ mood: 3, notes: 'meh' });
  });

  test('whitespace and newlines', () => {
    expect(parseMoodMessage('  5   great day ')).toEqual({ mood: 5, notes: 'great day' });
    expect(parseMoodMessage('4\ngood sleep')).toEqual({ mood: 4, notes: 'good sleep' });
  });

  test('boundaries 1 and 5 are valid', () => {
    expect(parseMoodMessage('1')).toEqual({ mood: 1, notes: '' });
    expect(parseMoodMessage('5')).toEqual({ mood: 5, notes: '' });
  });

  test('out of range', () => {
    expect(parseMoodMessage('0').error).toMatch(/out of range/);
    expect(parseMoodMessage('0.5').error).toMatch(/out of range/);
    expect(parseMoodMessage('5.5').error).toMatch(/out of range/);
    expect(parseMoodMessage('6').error).toMatch(/out of range/);
    expect(parseMoodMessage('-3').error).toMatch(/out of range/);
  });

  test('more than one decimal rejected', () => {
    expect(parseMoodMessage('3.55').error).toMatch(/one decimal/);
    expect(parseMoodMessage('4.25').error).toMatch(/one decimal/);
  });

  test('non-numeric rejected', () => {
    expect(parseMoodMessage('abc').error).toBeDefined();
    expect(parseMoodMessage('3abc').error).toBeDefined();
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
    expect(parseCommand('3')).toBeNull();
    expect(parseCommand('hello')).toBeNull();
    expect(parseCommand('')).toBeNull();
    expect(parseCommand(null)).toBeNull();
  });
});
