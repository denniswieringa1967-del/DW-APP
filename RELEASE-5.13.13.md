# DW APP 5.13.13 - release prepared, not deployed

The owner physically verified the private hosted route on laptop and Samsung: business selection, Energiecheck save, exact DW Flow dossier link, additional AI scan in the same lead/visit, retained energy usage and callback, reopening and returning to the Energiecheck. Two isolated test records were removed, original three leads and metadata matched their baseline hashes, and temporary review access was closed.

This release ports saved-visit navigation and one document-status block to the normal app. It also handles repeated field saves through the existing identity-checked intake followed by optimistic-version amendment, accepting the server's metadata confirmation. Changed callbacks use a separate optimistic followup operation. Documents are explicitly unavailable; no gateway is configured.

GitHub Pages cannot generate runtime configuration. Each login/app page now loads the existing owned https://dw-marketing.nl/flow/config.js, then runtime-bootstrap.js validates the expected public project and a publishable/anon browser key. No actual keys are committed. Failure leaves the client unconfigured/check-only. Service worker private-data exclusions remain, a missing image was removed from precache, and cache version increases.

Local validation: 31 field/runtime/repeated-save checks pass; JavaScript syntax checks pass. Public production-account end-to-end behavior is not yet verified.

Pending actions for the existing live app:
1. Add only the owned GitHub Pages Origin https://denniswieringa1967-del.github.io to dw-field-visit's exact allowlist, retaining JWT verification and the owner check. The attempted live Edge deployment was rejected by automatic approval review on 16 November, citing earlier branch-only/no-publication authorization; no function update occurred.
2. Enable owner-only field production writes in dw_field_private.settings after approval. Keep review disabled and gateway_hash empty so website/partner intake is not activated by this app release. No document secret or sanitizer change.
3. Apply the reviewed app source to main (the existing Pages publishing source), without publishing native Android artifacts or changing any other website.
4. Verify deployed asset hashes, actual origin preflight, denied anonymous access and the user's normal account. Do not claim public daily readiness until checked.

Rollback: retain main commit 178845b7d6add5aecdf037695e7ae4ea05a23e2d and the current Edge version. Production_enabled can return to false; review stays closed. Existing customer data must not change during deployment.
