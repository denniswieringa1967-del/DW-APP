# Shared field-visit receiver — prepared, not publicly activated

This extends the existing DW APP; it does not replace existing campaign functions or RLS.

- `dw-field-visit` requires gateway JWT verification. An owner session is verified with `auth.getUser`; the private service-only RPC additionally checks the configured active administrator.
- Production remains disabled in private settings. The temporary test credential has been revoked after the hosted test.
- Online server requests use a separate hashed gateway credential; they cannot list leads, select an arbitrary existing lead, issue document capabilities or open documents.
- Ingest reuses the submission/visit UUID. Explicit existing-lead binding validates ownership, company, canonical phone and address. The identity lock prevents concurrent duplicates.
- Additional AI and Compliance scan data attaches to that visit and lead; it does not start billing or report delivery.
- A short dossier can be amended with optimistic version checks. Identity changes require separate review; acquisition, consent, documents and callback remain authoritative.
- Annual bills reuse the existing private ZEB bucket, document registry, single-use hashed capabilities and rasterizer. Each new document has a visit binding. Browser PDF/JPG/PNG never writes directly to Storage.

## Hosting integration still required

Keep the existing public app unchanged until its protected hosting configuration is reviewed. Generate `runtime-config.js` outside Git using `tools/build-runtime.py`; it permits only a public publishable/anon key, never a service-role key. Set `DW_DOCUMENT_GATEWAY` to the owned HTTPS `/api/field-document-upload` URL. The generated config is ignored by Git and must be included only in the eventual deployment artifact, after approval. GitHub Pages cannot itself generate this file at request time. Keep integration mode `check` until the owner production session test passes.

The app itself is hosted on GitHub Pages. Mount `document_gateway.application` as WSGI on the owned `dw-marketing.nl` HTTPS backend, not on GitHub Pages and not a new paid service. The client accepts only this owned external origin or its own HTTPS origin. The gateway permits exactly its configured app Origin, never a wildcard. It needs Python, Pillow, PyMuPDF, Linux resource limits and a bounded request size. Pass these values through the hosting secret store only:

- `DW_SUPABASE_URL`
- `DW_SUPABASE_PUBLISHABLE_KEY`
- `DW_DOCUMENT_SANITIZER_SECRET`
- `DW_APP_ORIGIN`

Provision only the corresponding hash in private settings. The owner browser supplies its short-lived session token; no service-role credential is sent to the browser. Set `DW_APP_ORIGIN` to the exact verified GitHub Pages origin (without a path). Preflight permits only POST plus authorization/content-type headers. No cookies are sent. No content or credentials are logged or stored by the gateway.

For website intake, the existing server must normalize and forward only the public form fields, retain UTM/adgroup/keyword, use its private gateway credential and apply its existing anti-abuse controls. Do not put that credential in a static page. No live-domain website test is claimed here.

## Hosted isolated verification

`tests/field-chain.py` was executed against the actual protected Edge function and DW Flow database, using exactly two fictional leads. It checked repeated/concurrent submissions, canonical phones, existing lead binding, provenance, campaign, UTM, callbacks, extra scan, amendment and cross-lead/cross-visit document denial. All fictional leads, file objects and capabilities were deleted. Test access was then revoked and a new request returned 403.

Existing leads and lead_meta were verified with ordered `jsonb_agg(to_jsonb(row))` MD5 digests before and after. Both original digests matched. No main merge, public app deployment, advertisement or paid service was performed.

## Pending hosting facts, not completed tests

The active Pages publishing branch/folder or Actions workflow is not readable through the connected repository API. No existing workflow directory was found on this workbranch. Do not change Pages source or deploy this workbranch to the current live URL merely to test it. Confirm Settings → Pages → Build and deployment first. An isolated authenticated hosted preview and the current production-account session are still required.

Configure `DW_FIELD_ALLOWED_ORIGINS` on the existing Edge function for the verified Pages origin; this is distinct from the Python gateway CORS allowlist. Production writes remain disabled in the private receiver settings. Do not enable until the owner-session test and cleanup path are ready.

The service worker now intercepts only allowlisted same-origin public app assets. Runtime configuration, authenticated requests, API data and documents bypass its cache.
