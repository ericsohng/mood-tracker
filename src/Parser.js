/**
 * Pure parsing + validation logic. No Google APIs here, so this file is
 * unit-tested off-platform with Jest (see test/parser.test.js).
 *
 * The trailing `module.exports` guard lets Node/Jest require these functions
 * locally; in Apps Script `module` is undefined, so the block is skipped and
 * the functions live in the global namespace like any other .gs file.
 */

var MOOD_MIN = 1;
var MOOD_MAX = 10;

/**
 * Parse a free-text mood message into a mood + optional notes.
 * Accepts: "7", "7 slept badly", "8, tired", "  10  great day ".
 * The mood must be a whole number 1-10 and the first token in the message.
 *
 * @param {string} text
 * @return {{mood:number, notes:string}|{error:string}}
 */
function parseMoodMessage(text) {
  if (text === null || text === undefined) {
    return { error: emptyError_() };
  }
  var trimmed = String(text).trim();
  if (!trimmed) {
    return { error: emptyError_() };
  }
  // Mood is a leading number that ends at whitespace, comma, dash, or EOL.
  var match = trimmed.match(/^(-?\d+(?:\.\d+)?)(?![^\s,–-])\s*[,–-]?\s*([\s\S]*)$/);
  if (!match) {
    return { error: formatError_() };
  }
  var mood = Number(match[1]);
  var notes = match[2].trim();
  if (!Number.isInteger(mood)) {
    return { error: notWholeError_(match[1]) };
  }
  if (mood < MOOD_MIN || mood > MOOD_MAX) {
    return { error: rangeError_(mood) };
  }
  return { mood: mood, notes: notes };
}

/**
 * Detect a slash command such as "/stats" or "/help@MyBot".
 * @param {string} text
 * @return {string|null} lowercased command name without the slash, or null.
 */
function parseCommand(text) {
  if (!text) return null;
  var m = String(text).trim().match(/^\/([a-zA-Z_]+)(?:@\w+)?\b/);
  return m ? m[1].toLowerCase() : null;
}

function emptyError_() {
  return 'Send a mood from ' + MOOD_MIN + '–' + MOOD_MAX +
    ', e.g. "7" or "7 slept badly".';
}

function formatError_() {
  return 'I couldn\'t read a number. Send a mood from ' + MOOD_MIN + '–' + MOOD_MAX +
    ', optionally with notes, e.g. "7 tired".';
}

function notWholeError_(raw) {
  return 'Use a whole number from ' + MOOD_MIN + '–' + MOOD_MAX + ' (got ' + raw + ').';
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
