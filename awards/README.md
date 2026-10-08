# Vision & Values Awards

Independent app at `/awards/`; the existing survey is unchanged.

## Current mode

`config.js` is in preview mode. Preview drafts are stored under a separate browser key and never sent. A confirmed server response is required for a real success screen. No scheduled emails are enabled. The work email is deliberately absent from executable configuration.

## Connect Google Sheets

1. Create/open the chosen awards spreadsheet. Open **Extensions → Apps Script**.
2. Replace `Code.gs` with `google-apps-script/Code.gs`. Set the project timezone to Australia/Sydney. The supplied manifest records the required scopes.
3. In Project Settings → Script properties, set `TEST_RECIPIENT` to the agreed personal testing address (keep email addresses out of the public repository). Run `setupAwards` and complete Google's account authorization. This creates a test voting tab, remembers the spreadsheet ID and leaves email off. Reload the sheet for its **Values Awards** menu.
4. Deploy as a **Web app**, running as the owner, accessible to **Anyone** (voters do not sign in). This creates a public submission endpoint, not public access to the spreadsheet. No endpoint returns nominations or voting IDs.
5. Put the deployed `/exec` URL in `config.js`, set `preview:false`, publish that change. Do not reuse the old feedback endpoint.
6. Submit a test nomination, edit it and submit again: there should still be one row. Check the recap via **Preview recap in this sheet**. **Send test recap to Bret** sends only to the personal test address.
7. Use **Start a fresh TEST round** as often as needed. Existing tabs remain archived; a new campaign ID clears returning browser drafts on their next connection. Never manually wipe a current live round.

## Before going live

Requires explicit user approval. Start a clean campaign, set `MODE` to `LIVE`, and only then configure the approved final recipient and remove the test-only recipient gate. Verify final recipient access to the private sheet. Do not enable the schedule until the email has been reviewed. The provided test schedule is Monday and Thursday during the 9am hour in Australia/Sydney; Apps Script does not guarantee an exact minute.

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
