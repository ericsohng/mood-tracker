/**
 * Telegram webhook entrypoint. Deployed as a Web App ("Execute as me" /
 * "Anyone"), because Telegram's servers call it anonymously.
 *
 * Two guards protect the public endpoint:
 *   1. e.parameter.token must equal WEBHOOK_SECRET (secret carried in the URL,
 *      since Apps Script cannot read request headers).
 *   2. the sender's chat id must equal the configured owner CHAT_ID.
 */

function doGet() {
  return ContentService.createTextOutput('Mood tracker is running.');
}

function doPost(e) {
  try {
    var cfg = getConfig_();

    if (!e || !e.parameter || e.parameter.token !== cfg.webhookSecret) {
      return jsonOut_({ ok: false }); // unauthorized — ignore quietly
    }
    if (!e.postData || !e.postData.contents) {
      return jsonOut_({ ok: true });
    }

    var update = JSON.parse(e.postData.contents);
    var msg = update && update.message;
    if (!msg || !msg.chat) {
      return jsonOut_({ ok: true });
    }
    if (String(msg.chat.id) !== cfg.chatId) {
      return jsonOut_({ ok: true }); // not the owner — ignore
    }

    handleMessage_(msg.text || '', msg.chat.id);
    return jsonOut_({ ok: true });
  } catch (err) {
    console.error('doPost error: ' + ((err && err.stack) || err));
    return jsonOut_({ ok: false });
  }
}

/**
 * Route an incoming message: slash command vs. mood entry.
 */
function handleMessage_(text, chatId) {
  var cmd = parseCommand(text);
  if (cmd) {
    handleCommand_(cmd, chatId);
    return;
  }

  var parsed = parseMoodMessage(text);
  if (parsed.error) {
    tgSendMessage_(chatId, parsed.error);
    return;
  }

  var when = new Date();
  appendEntry_({ mood: parsed.mood, notes: parsed.notes, source: 'reply', when: when });
  var stamp = Utilities.formatDate(when, Session.getScriptTimeZone(), 'EEE h:mm a');
  tgSendMessage_(chatId, '✅ Logged ' + parsed.mood +
    (parsed.notes ? ' — ' + parsed.notes : '') + ' · ' + stamp);
}

function handleCommand_(cmd, chatId) {
  if (cmd === 'start' || cmd === 'help') {
    tgSendMessage_(chatId, helpText_());
    return;
  }
  if (cmd === 'stats') {
    var summary = summarize(readEntries_(), new Date());
    tgSendMessage_(chatId, formatSummary(summary));
    return;
  }
  tgSendMessage_(chatId, 'Unknown command.\n\n' + helpText_());
}

function helpText_() {
  return [
    'Log your mood by sending a number 1–5 (decimals ok), optionally with notes:',
    '  3.5',
    '  4 great workout',
    '',
    'Commands:',
    '  /stats — today & 7-day averages',
    '  /help — this message'
  ].join('\n');
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
