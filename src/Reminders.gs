/**
 * Scheduled reminder prompts. installTriggers() wires up one daily time-based
 * trigger per REMINDER_TIMES slot (default 09:00 / 14:00 / 20:00, in the
 * script's time zone). Apps Script fires daily triggers within a ~15-minute
 * window around the requested time.
 */

function sendMorningReminder() {
  tgNotifyOwner_('🌅 Morning check-in — how are you feeling (1–10)? ' +
    'Reply with a number, e.g. "7 slept well".');
}

function sendAfternoonReminder() {
  tgNotifyOwner_('☀️ Afternoon check-in — mood right now (1–10)?');
}

function sendEveningReminder() {
  tgNotifyOwner_('🌙 Evening check-in — how did today feel overall (1–10)?');
}

/**
 * Recreate the daily reminder triggers from REMINDER_TIMES. Idempotent:
 * removes any existing triggers for these handlers first.
 */
function installTriggers() {
  var handlers = ['sendMorningReminder', 'sendAfternoonReminder', 'sendEveningReminder'];

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (handlers.indexOf(t.getHandlerFunction()) >= 0) {
      ScriptApp.deleteTrigger(t);
    }
  });

  var times = getConfig_().reminderTimes;
  var installed = 0;
  handlers.forEach(function (handler, i) {
    var time = times[i];
    if (!time) return;
    var parts = time.split(':');
    var hour = Number(parts[0]);
    var minute = Number(parts[1] || 0);
    ScriptApp.newTrigger(handler)
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .nearMinute(minute)
      .create();
    installed++;
  });

  console.log('Installed ' + installed + ' daily reminder trigger(s).');
}
