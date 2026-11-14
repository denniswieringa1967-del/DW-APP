# DW Nummerherkenning TEST 0.3

Targeted update of the existing native component; no main merge or live web deployment.

- Declares ACCESS_NETWORK_STATE, required for the existing JobScheduler network constraint on Android 14+.
- Distinguishes successful manual synchronization from background-job scheduling. A scheduling failure no longer becomes a misleading sign-in error.
- Places status at the top and shows the last successful synchronization time and expiry. Background execution remains subject to Android scheduling and connectivity; an expired snapshot is never treated as current.
- Logout has a separate, explicit confirmation and status. No new login is required for manual synchronization when the encrypted session remains valid.
- Opens the existing authenticated DW Flow dossier URL using view=leads and the exact matched lead UUID. Only the confirmed owned HTTPS host and exact path are allowed. No tokens appear in that URL. If the browser first asks for login, return to the caller notification and reopen the dossier after signing in.

## Validation

Compiled Java 17 against Android SDK 35; generated DEX for minimum API 29. APK alignment and v3 signature verified. 12 native phone-normalization checks, 13 dossier-link checks, and 29 caller-ID/device-proof model checks passed. The actual installed 0.3 version still requires a physical Samsung test: manual update, background update and dossier opening. The successful earlier incoming-call test applies to 0.2.

## Installing this build

The prior test signing key was not retained, so 0.3 has a different test certificate. Android cannot install it over 0.2. After receiving 0.3, uninstall only DW Nummerherkenning TEST, install 0.3, export its new public device key, and update only CALLER_DEVICE_PUBLIC_KEY_B64 in the private Edge configuration. Keep CALLER_OWNER_USER_ID unchanged. Uninstalling the test app deletes only its local encrypted session, snapshot and app key; DW Flow records and Samsung call history stay intact. Re-select the caller-ID role and notification/contact permissions afterward.

The private signing key is excluded from Git, APK and ordinary deliverables. Durable storage in the owner's encrypted server Vault remains pending explicit approval after automatic review rejected the unapproved private-key transfer. No signing credential was saved remotely by that rejected action.
