/**
 * One-off migration: halve every existing mood score to move from the old
 * 1–10 scale to the new 1–5 scale. Guarded by a Script Property flag so it
 * can never double-halve, even if run twice.
 *
 * Run this ONCE, right after deploying the new code and BEFORE logging any
 * new 1–5 entries (it can't tell an old value from a new one — it halves the
 * whole mood column).
 */

var SCALE_MIGRATION_FLAG = 'SCALE_HALVED_TO_5';

function migrateHalveScores() {
  var props = PropertiesService.getScriptProperties();
  var done = props.getProperty(SCALE_MIGRATION_FLAG);
  if (done) {
    console.log('Already migrated on ' + done + ' — skipping to avoid double-halving.');
    return;
  }

  var sheet = getEntriesSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    console.log('No entries to migrate.');
    props.setProperty(SCALE_MIGRATION_FLAG, new Date().toISOString());
    return;
  }

  var range = sheet.getRange(2, 2, lastRow - 1, 1); // column B = mood
  var values = range.getValues();
  var count = 0;
  var out = values.map(function (row) {
    var v = Number(row[0]);
    if (!Number.isFinite(v)) return row; // leave blanks/non-numbers untouched
    count++;
    return [Math.round((v / 2) * 10) / 10]; // halve, round to 1 decimal
  });
  range.setValues(out);

  props.setProperty(SCALE_MIGRATION_FLAG, new Date().toISOString());
  console.log('Halved ' + count + ' score(s): old 1–10 values are now 0.5–5.');
}
