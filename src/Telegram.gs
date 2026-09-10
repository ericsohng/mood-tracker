/**
 * Minimal Telegram Bot API client (UrlFetchApp). Only the handful of methods
 * this project needs: send a message and register the webhook.
 */

function tgApiUrl_(method) {
  return 'https://api.telegram.org/bot' + getConfig_().botToken + '/' + method;
}

/**
 * Send a plain-text message to a chat.
 * @return {boolean} true on HTTP 200.
 */
function tgSendMessage_(chatId, text) {
  var resp = UrlFetchApp.fetch(tgApiUrl_('sendMessage'), {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: chatId, text: text })
  });
  var code = resp.getResponseCode();
  if (code !== 200) {
    console.error('Telegram sendMessage failed: ' + code + ' ' + resp.getContentText());
  }
  return code === 200;
}

/**
 * Notify the configured owner chat.
 */
function tgNotifyOwner_(text) {
  return tgSendMessage_(getConfig_().chatId, text);
}

/**
 * Point Telegram's webhook at this Web App. The shared secret is passed as a
 * URL query param (?token=...) because Apps Script Web Apps cannot read
 * request headers — doPost verifies e.parameter.token against WEBHOOK_SECRET.
 *
 * @param {string} webAppExecUrl The deployed Web App /exec URL.
 */
function setWebhook_(webAppExecUrl) {
  var cfg = getConfig_();
  var sep = webAppExecUrl.indexOf('?') >= 0 ? '&' : '?';
  var url = webAppExecUrl + sep + 'token=' + encodeURIComponent(cfg.webhookSecret);
  var resp = UrlFetchApp.fetch(tgApiUrl_('setWebhook'), {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({ url: url, allowed_updates: ['message'] })
  });
  console.log('setWebhook: ' + resp.getResponseCode() + ' ' + resp.getContentText());
  return resp.getContentText();
}
