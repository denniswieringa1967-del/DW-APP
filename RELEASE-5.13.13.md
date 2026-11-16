# DW APP 5.13.13 - published 16 November 2026

The owner explicitly approved publication on main/GitHub Pages and owner-only DW Flow storage after the automatic approval review initially rejected a live backend change under the older branch-only restriction. The subsequent approved deployment succeeded.

Public app: https://denniswieringa1967-del.github.io/DW-APP/
Main release commit: acbb633d2026e44d673061cde626f723ff01146a. Fourteen app/login assets copied selectively from the reviewed branch; native Android artifacts and unrelated backend/test files were not published to main. GitHub Pages build and deployment succeeded; all 14 live asset Git blob hashes match the reviewed release.

Supabase dw-field-visit version 5 adds only the owned Pages Origin to the existing allowlist. JWT verification stays enabled. Missing browser authentication returns HTTP 401; direct private RPC access remains denied to anon and authenticated roles. Active owner configuration was verified before enabling production field writes. Review access is disabled and the website gateway hash is empty, so website intake was not activated. Original three leads and lead_meta exactly match their pre-test baseline digests.

The public runtime loads the existing owned Flow public browser configuration outside Git; actual runtime evaluation confirms live field mode, dw-field-visit and an empty document gateway. No actual API key was committed. Annual-bill upload remains unavailable with an explicit UI message. Existing document controls were not enabled.

Private hosted laptop and Samsung tests verified business selection, exact dossier opening, repeated corrections, AI attached to the same lead/visit, retained 25000 kWh/4000 m3 and callback, reopening and switching back. Two fictional test dossiers and temporary test credentials were removed. Local release validation passed 31 checks plus JavaScript syntax checks.

The owner still needs to reopen the normal installed/public app to verify the current signed-in browser session. No fresh public production-account end-to-end write has been claimed. Rollback: main 178845b7d6add5aecdf037695e7ae4ea05a23e2d; field production_enabled can be returned to false with review remaining closed.
