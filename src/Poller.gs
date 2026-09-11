/**
 * Polling-based updates.
 *
 * Apps Script web apps answer a POST with a 302 redirect, which Telegram's
 * webhook client rejects ("Wrong response from the webhook: 302 Found"). So
 * instead of a webhook we poll getUpdates on a 5-minute trigger. Reply latency
 * is up to ~5 minutes — fine for mood logging. Reuses handleMessage_ from
 * Webhook.gs and tgApiUrl_ from Telegram.gs.
 */

var LAST_UPDATE_PROP = 'LAST_UPDATE_ID';

/**
 * Fetch new updates since the last processed offset.
 * @return {Array} Telegram update objects (message updates only).
 */
function tgGetUpdates_(offset) {
  var resp = UrlFetchApp.fetch(tgApiUrl_('getUpdates'), {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({ offset: offset, timeout: 0, allowed_updates: ['message'] })
  });
  var data = JSON.parse(resp.getContentText());
  if (!data.ok) {
    console.error('getUpdates failed: ' + resp.getContentText());
    return [];
  }
  return data.result || [];
}

/**
 * Pull and process new messages. Runs on the 5-minute trigger.
 */
function pollUpdates() {
  var cfg = getConfig_();
  var props = PropertiesService.getScriptProperties();
  var lastId = Number(props.getProperty(LAST_UPDATE_PROP) || 0);

  var updates = tgGetUpdates_(lastId ? lastId + 1 : 0);
  if (!updates.length) return;

  var maxId = lastId;
  updates.forEach(function (u) {
    if (u.update_id > maxId) maxId = u.update_id;
    var msg = u.message;
    if (!msg || !msg.chat) return;
    if (String(msg.chat.id) !== cfg.chatId) return; // only the owner may log
    try {
      handleMessage_(msg.text || '', msg.chat.id);
    } catch (err) {
      console.error('handleMessage error: ' + ((err && err.stack) || err));
    }
  });

  props.setProperty(LAST_UPDATE_PROP, String(maxId));
}

/**
 * Install (or refresh) the 5-minute polling trigger. Idempotent.
 */
function installPolling() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'pollUpdates') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('pollUpdates').timeBased().everyMinutes(5).create();
  console.log('Polling installed: pollUpdates runs every 5 minutes.');
}
