/**
 * One-time setup helpers, run from the Apps Script editor after the required
 * Script Properties are set.
 *
 *   setup()                    — create entries + dashboard tabs, headers, charts
 *   registerWebhook('<url>')   — (legacy) point a webhook at the web app
 *   installTriggers()          — schedule reminders (see Reminders.gs)
 */

function setup() {
  var ss = getSpreadsheet_();

  var entries = ss.getSheetByName(ENTRIES_SHEET_NAME) || ss.insertSheet(ENTRIES_SHEET_NAME);
  if (entries.getLastRow() === 0) {
    entries.appendRow(HEADERS);
  }
  entries.setFrozenRows(1);
  entries.getRange('A2:A').setNumberFormat('yyyy-mm-dd hh:mm');

  buildDashboard_(ss, entries);
  console.log('Setup complete: "' + ENTRIES_SHEET_NAME + '" and "' +
    DASHBOARD_SHEET_NAME + '" are ready.');
}

function buildDashboard_(ss, entries) {
  var dash = ss.getSheetByName(DASHBOARD_SHEET_NAME) || ss.insertSheet(DASHBOARD_SHEET_NAME);
  dash.clear();
  dash.getCharts().forEach(function (c) { dash.removeChart(c); });

  dash.getRange('A1').setValue('Metric');
  dash.getRange('B1').setValue('Value');
  dash.getRange('A2').setValue('Total entries');
  dash.getRange('B2').setFormula('=COUNT(entries!B2:B)');
  dash.getRange('A3').setValue('Overall avg');
  dash.getRange('B3').setFormula('=IFERROR(ROUND(AVERAGE(entries!B2:B),1),"—")');
  dash.getRange('A4').setValue('Last 7-day avg');
  dash.getRange('B4').setFormula(
    '=IFERROR(ROUND(AVERAGEIFS(entries!B2:B,entries!A2:A,">="&(NOW()-7)),1),"—")');

  dash.getRange('A6').setValue('Day part');
  dash.getRange('B6').setValue('Avg mood');
  ['morning', 'afternoon', 'evening'].forEach(function (part, i) {
    var row = 7 + i;
    dash.getRange('A' + row).setValue(part);
    dash.getRange('B' + row).setFormula(
      '=IFERROR(ROUND(AVERAGEIF(entries!D2:D,"' + part + '",entries!B2:B),1),"—")');
  });

  var overTime = dash.newChart()
    .asLineChart()
    .addRange(entries.getRange('A:B'))
    .setNumHeaders(1)
    .setOption('title', 'Mood over time')
    .setOption('legend', { position: 'none' })
    .setOption('vAxis', { viewWindow: { min: 0, max: 5 }, title: 'Mood (1–5)' })
    .setPosition(1, 4, 0, 0)
    .build();
  dash.insertChart(overTime);

  var byPart = dash.newChart()
    .asColumnChart()
    .addRange(dash.getRange('A6:B9'))
    .setNumHeaders(1)
    .setOption('title', 'Average mood by day part')
    .setOption('legend', { position: 'none' })
    .setOption('vAxis', { viewWindow: { min: 0, max: 5 } })
    .setPosition(20, 4, 0, 0)
    .build();
  dash.insertChart(byPart);
}

function registerWebhook(webAppExecUrl) {
  if (!webAppExecUrl) {
    throw new Error('Pass your deployed Web App /exec URL, e.g. ' +
      'registerWebhook("https://script.google.com/macros/s/XXXX/exec")');
  }
  return setWebhook_(webAppExecUrl);
}
