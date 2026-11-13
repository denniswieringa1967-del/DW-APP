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

Keep the existing public app unchanged until its protected hosting configuration is reviewed. Generate `runtime-config.js` outside Git, set `campaignIntakeFunction` to `dw-field-visit` and set `documentGatewayBase` to `/api/field-document-upload`. Keep integration mode `check` until the owner production session test passes.

Mount `document_gateway.application` as WSGI on the existing HTTPS host, not a new public service. It needs Python, Pillow, PyMuPDF, Linux resource limits and a bounded request size. Pass these values through the hosting secret store only:

- `DW_SUPABASE_URL`
- `DW_SUPABASE_PUBLISHABLE_KEY`
- `DW_DOCUMENT_SANITIZER_SECRET`

Provision only the corresponding hash in private settings. The owner browser supplies its short-lived session token; no service-role credential is sent to the browser. Exact HTTPS Origin must match the host. No content or credentials are logged or stored by the gateway.

For website intake, the existing server must normalize and forward only the public form fields, retain UTM/adgroup/keyword, use its private gateway credential and apply its existing anti-abuse controls. Do not put that credential in a static page. No live-domain website test is claimed here.

## Hosted isolated verification

`tests/field-chain.py` was executed against the actual protected Edge function and DW Flow database, using exactly two fictional leads. It checked repeated/concurrent submissions, canonical phones, existing lead binding, provenance, campaign, UTM, callbacks, extra scan, amendment and cross-lead/cross-visit document denial. All fictional leads, file objects and capabilities were deleted. Test access was then revoked and a new request returned 403.

Existing leads and lead_meta were verified with ordered `jsonb_agg(to_jsonb(row))` MD5 digests before and after. Both original digests matched. No main merge, public app deployment, advertisement or paid service was performed.
