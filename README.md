# Teams Name Tidy

A Chromium (Edge/Chrome) browser extension that reformats Microsoft names from `Lastname, Firstname (Platform)` to `Firstname Lastname`, in both **Microsoft Teams** and **Outlook on the web**.

Example: `Doe, Jane (Example Platform)` → `Jane Doe`

## Install (unpacked)

1. Open `edge://extensions` (Edge) or `chrome://extensions` (Chrome).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this `TeamsNames` folder.
4. Open Teams web (`teams.microsoft.com`) or Outlook web (`outlook.office.com`) — names are tidied automatically.

## Where it runs

Configured in `manifest.json`:

- Teams: `teams.microsoft.com`, `teams.live.com`, `teams.cloud.microsoft`
- Outlook web: `outlook.office.com`, `outlook.office365.com`
- MCAS proxy variants (`*.mcas.ms`, `teams.microsoft.com.mcas.ms`)

## Files

- `manifest.json` — MV3 config; content script match list for the domains above.
- `content.js` — walks text nodes + a MutationObserver, rewriting matching names.
- `icons/` — toolbar icons.

## Notes

- Drops the trailing platform/group and reorders to `First Last`.
- Rewrites both visible text and `aria-label` / `title` attributes.
- Leaves non-name labels (e.g. team names) untouched.
- Skips text you're editing (contentEditable) and transient UI such as
  menus, listboxes, comboboxes, and dialogs, to avoid disrupting input.
- Batches DOM updates (via `requestIdleCallback`) to stay light on the page.
