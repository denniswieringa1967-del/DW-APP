# Caller-ID TEST 0.4

The physical Samsung test still opens the generic calling list from the notification, while a manually opened exact dossier link works. The cause is not yet proven. This update adds fresh per-open page URLs and a copy-link action to make the outgoing target observable without logs or secrets.

The destination remains the existing HTTPS DW Flow dossier route with the exact matched UUID. Each launch adds caller=android-04 and a timestamp and requests a new browser tab (a browser hint, not a guarantee). The copy button uses the same route builder. Normal browser owner authentication remains required. There are no customer-data or backend changes.

Version code 4, version name 0.4-test. Signed with the same certificate as TEST 0.3, so install as an in-place update; do not uninstall or clear app data. Signature SHA256: bed3bf9df3bee44e71fb55ea80cffc46f2ebf5cfea2ac32602afa7c6674f53a0. APK SHA256: 524ec39c37400728cb265ac5323cddb8cd74a282de9c6bdf9ba7fd65475c687b. No API keys, device keys, customer records or signing secrets in this source commit.

Validation: Java sources compile against Android 35; 29 model/device-proof tests and 16 dossier-link checks pass; package/version/permissions verified; APK signature matches TEST 0.3. Physical Android/browser end-to-end result remains unconfirmed.

Live Flow app.js correction and a single HTML script-version change were uploaded by the owner. HTML file permissions were restored to 0644 after extracting a ZIP. These live edits are not a claim of successful notification navigation. Do not publish or merge the DW APP work branch. Remove the isolated test dossier only after the physical test finishes.
