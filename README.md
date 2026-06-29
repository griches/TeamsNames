# Teams Name Tidy

A Chromium (Edge/Chrome) browser extension that reformats Microsoft Teams names from `Lastname, Firstname (Platform)` to `Firstname Lastname`.

Example: `Doe, Jane (Example Platform)` → `Jane Doe`

## Install (unpacked)

1. Open `edge://extensions` (Edge) or `chrome://extensions` (Chrome).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this `TeamsNames` folder.
4. Open Teams web (`teams.microsoft.com`) — names are tidied automatically.

## Files

- `manifest.json` — MV3 config; runs on Teams domains.
- `content.js` — walks text nodes + MutationObserver, rewrites matching names.
- `icons/` — toolbar icons.

## Notes

- Drops the trailing platform/group and reorders to `First Last`.
- Leaves non-name labels (e.g. team names) untouched.
