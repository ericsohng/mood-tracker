# Mood Tracker

A personal mood tracker with **zero servers and no monthly cost**. A Telegram bot
pings you a few times a day; you reply with a number 1–5 (plus optional notes) and it
lands in a Google Sheet that auto-graphs your mood. Built on Google Apps Script.

```
You ⇄ Telegram bot  ──webhook──▶  Apps Script (doPost)  ──▶  Google Sheet (+ charts)
                     ◀──reply──                    ▲
                                Apps Script triggers ┘  (3× daily reminders)
```

## What's here

| Path | Role |
|---|---|
| `src/Parser.js` | **Pure** message parsing/validation — unit-tested |
| `src/Stats.js` | **Pure** stats + formatting — unit-tested |
| `src/Config.gs` | Reads settings/secrets from Script Properties |
| `src/Store.gs` | Google Sheet read/append |
| `src/Telegram.gs` | Telegram Bot API client |
| `src/Webhook.gs` | `doPost` webhook entrypoint + message routing |
| `src/Reminders.gs` | Scheduled reminder prompts + trigger install |
| `src/Setup.gs` | `setup()` (sheets + charts), `registerWebhook()` |
| `test/` | Jest tests for the pure logic |

## Prerequisites

- Node.js (for the local tests / `clasp`)
- A **personal** Google account (see *Identity* below)
- A Telegram account

---

## Identity — keep this personal, not work

This project must not touch your Helix identity. Three fronts to isolate:

1. **Google account → personal.** Do `clasp login` and create the Sheet while signed
   into your personal Google. Run `clasp logout` first if you're logged in as work.
2. **Git author → personal (repo-local).** Set it *in this repo only* so it never
   affects your work repos:
   ```bash
   git config user.name  "Your Name"
   git config user.email "your-personal@users.noreply.github.com"
   ```
3. **GitHub push → personal via SSH alias** (bypasses the work-authed `gh`/`GITHUB_TOKEN`):
   ```bash
   # one-time: personal key + host alias
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_personal   # add the .pub to personal GitHub
   cat >> ~/.ssh/config <<'EOF'

   Host github-personal
     HostName github.com
     User git
     IdentityFile ~/.ssh/id_ed25519_personal
     IdentitiesOnly yes
   EOF

   # create an empty "mood-tracker" repo on github.com while signed into PERSONAL GitHub,
   # then:
   git remote add origin git@github-personal:<your-personal-user>/mood-tracker.git
   ```
   Verify: `ssh -T git@github-personal` greets your personal username; `git config
   user.email` shows personal; `git remote -v` shows the `github-personal` alias.

---

## Setup runbook

### 1. Create the Telegram bot
- In Telegram, message **@BotFather** → `/newbot` → copy the **bot token**.
- Message **@userinfobot** → copy your numeric **chat id**.
- Invent a random **webhook secret** (any long random string).

### 2. Create the Sheet
- Signed into your **personal** Google account, create a blank Google Sheet.
- Copy its **id** from the URL: `docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`.

### 3. Install & authenticate clasp
```bash
npm install -g @google/clasp
clasp logout            # if previously logged in as work
clasp login             # authorize with your PERSONAL Google account
```
Also enable the Apps Script API once at <https://script.google.com/home/usersettings>.

### 4. Create the script project & push code
```bash
cd ~/projects/mood-tracker
# create a standalone script, then point clasp at src/:
clasp create --type standalone --title "Mood Tracker"
#   -> this writes .clasp.json. Edit it so it reads: {"scriptId":"...","rootDir":"src"}
#   (delete any appsscript.json clasp created OUTSIDE src/ — we keep ours in src/)
clasp push --force
```
(If `clasp create` complains about existing files, instead create the script in the
browser at script.google.com, copy its Script ID into `.clasp.json` using
`.clasp.json.example` as the template, then `clasp push --force`.)

### 5. Add Script Properties
In the Apps Script editor (`clasp open`): **Project Settings → Script Properties** →
add:

| Key | Value |
|---|---|
| `BOT_TOKEN` | from @BotFather |
| `CHAT_ID` | your numeric chat id |
| `SHEET_ID` | the Sheet id |
| `WEBHOOK_SECRET` | your random string |
| `REMINDER_TIMES` | *(optional)* e.g. `09:00,14:00,20:00` |

Also set the project **time zone** (Project Settings) and `src/appsscript.json`
`timeZone` to yours (default is `America/Los_Angeles`).

### 6. Initialize sheets & schedule reminders
In the editor, run these once (authorize scopes when prompted):
- `setup()` — builds the `entries` + `dashboard` tabs and charts
- `installTriggers()` — schedules the daily reminders

### 7. Deploy the Web App & register the webhook
```bash
clasp deploy            # choose: Execute as ME, Access: ANYONE
```
Copy the deployment's **Web App /exec URL**, then in the editor run:
```
registerWebhook('https://script.google.com/macros/s/XXXX/exec')
```
> Security note: the webhook secret travels in the URL query (`?token=...`) rather than
> a header, because Apps Script Web Apps cannot read request headers. `doPost` rejects
> any call whose `token` ≠ `WEBHOOK_SECRET`, and also ignores any sender that isn't your
> `CHAT_ID`.

---

## Test it

**Local unit tests** (pure logic):
```bash
npm install
npm test
```

**End-to-end smoke test:**
- Message the bot `3.5 good day` → a row appears in `entries` + a `✅ Logged 3.5 …` reply.
- Message `abc` and `6` → friendly error, no row written.
- `/stats` → today + 7-day averages.
- In the editor, run `sendMorningReminder()` → you get the ping.
- Add a few rows → the `dashboard` charts populate.

## Roadmap (not in MVP)

- **Google Calendar correlation** — join events to mood by time window (same runtime, cheap).
- Smart nudges (skip a reminder if you already logged that window).
- `/undo`, `/edit`, weekly summary with a chart image.
- One-tap phone widget (iOS Shortcut / Android) hitting the same endpoint.
