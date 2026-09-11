/**
 * Pure parsing + validation logic. No Google APIs here, so this file is
 * unit-tested off-platform with Jest (see test/parser.test.js).
 *
 * Scale: 1–5, with up to one decimal place (e.g. 3.5). The mood must be the
 * first token in the message; anything after it is treated as notes.
 */

var MOOD_MIN = 1;
var MOOD_MAX = 5;

function parseMoodMessage(text) {
  if (text === null || text === undefined) {
    return { error: emptyError_() };
  }
  var trimmed = String(text).trim();
  if (!trimmed) {
    return { error: emptyError_() };
  }
  var match = trimmed.match(/^(-?\d+(?:\.\d+)?)(?![^\s,–-])\s*[,–-]?\s*([\s\S]*)$/);
  if (!match) {
    return { error: formatError_() };
  }
  var raw = match[1];
  var mood = Number(raw);
  var notes = match[2].trim();

  var dot = raw.indexOf('.');
  if (dot !== -1 && raw.length - dot - 1 > 1) {
    return { error: precisionError_(raw) };
  }
  if (mood < MOOD_MIN || mood > MOOD_MAX) {
    return { error: rangeError_(mood) };
  }
  return { mood: mood, notes: notes };
}

function parseCommand(text) {
  if (!text) return null;
  var m = String(text).trim().match(/^\/([a-zA-Z_]+)(?:@\w+)?\b/);
  return m ? m[1].toLowerCase() : null;
}

function emptyError_() {
  return 'Send a mood from ' + MOOD_MIN + '–' + MOOD_MAX +
    ' (decimals ok), e.g. "3.5" or "4 slept badly".';
}

function formatError_() {
  return 'I couldn\'t read a number. Send a mood from ' + MOOD_MIN + '–' + MOOD_MAX +
    ' (decimals ok), e.g. "3.5 tired".';
}

function precisionError_(raw) {
  return 'Use at most one decimal place (e.g. 3.5) — got ' + raw + '.';
}

function rangeError_(mood) {
  return 'Mood ' + mood + ' is out of range — use ' + MOOD_MIN + '–' + MOOD_MAX + '.';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseMoodMessage: parseMoodMessage,
    parseCommand: parseCommand,
    MOOD_MIN: MOOD_MIN,
    MOOD_MAX: MOOD_MAX
  };
}
