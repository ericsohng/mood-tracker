/**
 * Central configuration. Every secret/setting is read from Script Properties
 * so nothing sensitive is ever committed to git.
 *
 * Set these once via the Apps Script editor
 * (Project Settings → Script Properties) or programmatically:
 *
 *   BOT_TOKEN        Telegram bot token from @BotFather              (required)
 *   CHAT_ID          Your Telegram chat id — only this chat may write (required)
 *   SHEET_ID         Spreadsheet id that stores entries              (required)
 *   WEBHOOK_SECRET   Random string; guards the public webhook URL    (required)
 *   REMINDER_TIMES   Comma-separated "HH:MM" (default 09:00,14:00,20:00) (optional)
 */

var REQUIRED_PROPS = ['BOT_TOKEN', 'CHAT_ID', 'SHEET_ID', 'WEBHOOK_SECRET'];
var DEFAULT_REMINDER_TIMES = '10:00,15:00,20:00';
var ENTRIES_SHEET_NAME = 'entries';
var DASHBOARD_SHEET_NAME = 'dashboard';

/**
 * Read and validate config from Script Properties.
 * @return {{botToken:string, chatId:string, sheetId:string,
 *           webhookSecret:string, reminderTimes:string[]}}
 */
function getConfig_() {
  var all = PropertiesService.getScriptProperties().getProperties();
  var missing = REQUIRED_PROPS.filter(function (k) { return !all[k]; });
  if (missing.length) {
    throw new Error('Missing Script Properties: ' + missing.join(', ') +
      '. Set them under Project Settings → Script Properties.');
  }
  return {
    botToken: all.BOT_TOKEN,
    chatId: String(all.CHAT_ID),
    sheetId: all.SHEET_ID,
    webhookSecret: all.WEBHOOK_SECRET,
    reminderTimes: (all.REMINDER_TIMES || DEFAULT_REMINDER_TIMES)
      .split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
  };
}
