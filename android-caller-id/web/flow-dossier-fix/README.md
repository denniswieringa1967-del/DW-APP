# Existing DW Flow dossier-link correction

Prepared only; not applied to the live website. No native APK update is required for this correction.

The live `flow/app.js` starts asynchronous boot, then its legacy V41 zero-delay view callback can call `openView()` before the lead data loads. `openView()` rewrites the URL without `lead`, and boot previously read the request afterward. The result is the generic leads/calling overview instead of the matched dossier.

The patch captures the requested view/lead before asynchronous loading and suppresses the duplicate V41 view callback only for dossier requests. Boot then opens the exact requested existing dossier after loading. Authentication, owner verification, RLS, session storage and all write operations are unchanged. Ordinary links to other views retain their existing behavior. The existing first-login behavior is unchanged: after signing in, reopen the dossier button from the native caller notification.

Five deterministic regression checks passed against the fetched live source: reproduce the original failure, open the exact dossier once after loading, preserve the entry target during URL mutation, retain the logged-out login gate, preserve a normal view link. JavaScript syntax check passed. This is not a claim of a successful Samsung/browser end-to-end test after deployment.

`baseline.json` records the exact downloaded live source hash. Before replacing the one existing `httpdocs/flow/app.js` file, verify that source is unchanged, take a recoverable backup, and obtain the owner's separate approval for the live file replacement. Do not replace any other website file, merge the DW APP branch, or change customer data. After deployment, test the current fictional caller-ID dossier and remove only its test records after the call/dossier check finishes.

Run locally with Node:
`node test-deeplink.cjs ORIGINAL-app.js FIXED-app.js`
