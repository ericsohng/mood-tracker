/**
 * Google Sheet persistence for mood entries.
 * Columns: timestamp | mood | notes | day_part | source
 *
 * `timestamp` is written as a real Date value (not an ISO string) so the
 * dashboard's time-axis chart and date-based AVERAGEIFS formulas work.
 */

var HEADERS = ['timestamp', 'mood', 'notes', 'day_part', 'source'];

function getSpreadsheet_() {
  return SpreadsheetApp.openById(getConfig_().sheetId);
}

/**
 * Return the entries sheet, creating it with headers if needed.
 */
function getEntriesSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(ENTRIES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ENTRIES_SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Append one mood entry.
 * @param {{mood:number, notes:string, source:string, dayPart:string, when:Date}} entry
 */
function appendEntry_(entry) {
  var sheet = getEntriesSheet_();
  var when = entry.when || new Date();
  sheet.appendRow([
    when,
    entry.mood,
    entry.notes || '',
    entry.dayPart || dayPartFor_(when),
    entry.source || 'reply'
  ]);
}

/**
 * Read all entries as plain objects for stats computation.
 * @return {Array<{timestamp:Date, mood:number, notes:string,
 *                 dayPart:string, source:string}>}
 */
function readEntries_() {
  var sheet = getEntriesSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values.map(function (row) {
    return {
      timestamp: row[0] instanceof Date ? row[0] : new Date(row[0]),
      mood: Number(row[1]),
      notes: row[2],
      dayPart: row[3],
      source: row[4]
    };
  });
}

/**
 * Bucket a Date into morning/afternoon/evening using local hours
 * (local = the script's configured time zone).
 */
function dayPartFor_(when) {
  var h = when.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
