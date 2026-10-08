# Vision & Values Awards

Independent app at `/awards/`; the existing survey is unchanged.

## Current mode

`config.js` is in preview mode. Preview drafts are stored under a separate browser key and never sent. A confirmed server response is required for a real success screen. No scheduled emails are enabled. The work email is deliberately absent from executable configuration.

## Connect Google Sheets

1. Create a separate standalone Apps Script project. Keep the existing everyday feedback script and deployment unchanged.
2. Replace the NEW project's `Code.gs` with `google-apps-script/Code.gs`. Set the project timezone to Australia/Sydney. The supplied manifest records the required scopes.
3. In Project Settings → Script properties, set `SPREADSHEET_ID` to the chosen existing spreadsheet's ID and `TEST_RECIPIENT` to the agreed personal testing address (keep both out of the public repository). Run `setupAwards` and complete Google's account authorization. This creates a separate awards test tab and leaves email off.
4. Deploy as a **Web app**, running as the owner, accessible to **Anyone** (voters do not sign in). This creates a public submission endpoint, not public access to the spreadsheet. No endpoint returns nominations or voting IDs.
5. Put the deployed `/exec` URL in `config.js`, set `preview:false`, publish that change. Do not reuse the old feedback endpoint.
6. Submit a test nomination, edit it and submit again: there should still be one row. Run `previewRecap` for a text recap in the execution log. `sendTestRecap` sends only to the personal test address.
7. Run `resetTestRound` as often as needed. Existing tabs remain archived; a new campaign ID clears returning browser drafts on their next connection. Never manually wipe a current live round.

## Before going live

Requires explicit user approval. Start a clean campaign and set `MODE` to `LIVE`. The organiser has chosen to keep recaps going to the personal address and forward them manually; do not switch to a work address. Keep the recipient gate in place. Do not enable the schedule until the email has been reviewed. The provided schedule is Monday and Thursday during the 9am hour in Australia/Sydney; Apps Script does not guarantee an exact minute.

Every recap is the **complete current snapshot**, grouped by value, preserving free-text names and reasons. Prior email totals must not be added together. Aliases are resolved manually. No winner is selected automatically.

## Behaviour

- Five values shuffled once per page load; each answer keyed by stable value ID.
- Optional categories; a submitted nomination requires a name and a short reason.
- Local browser UUID identifies the editable row. Different browsers/devices can create separate entries.
- Voter name/nickname is accepted but not required; provided names appear in the private recap. The form does not label the field optional.
- Locks prevent simultaneous submissions appending duplicate rows. Retrying after a lost response updates the same row.
- Drafts persist locally; only Submit saves to Sheets. All submitted nominations may be cleared later to withdraw them.
- Public participation state is a boolean only. Equal value sizes and decorative glow never encode results.
- No public read endpoint for individual votes. Browser ID is an unguessable edit capability, not user authentication.
- Names/reasons are HTML-escaped for emails and formula-escaped for Sheets.
- Test-round resets archive data and disable email; client campaign checks prevent stale saves.
- Success requires JSON confirmation. A network/CORS failure keeps the draft and does not show success.

The end-to-end Google deployment and email delivery must be verified after connecting the sheet.
