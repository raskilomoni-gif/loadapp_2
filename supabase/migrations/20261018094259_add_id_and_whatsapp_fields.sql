/*
# Add ID verification, WhatsApp, and driver license scan fields

1. Modified Tables
- `profiles`
  - `id_number` (text, nullable) — National ID / Passport / DL number for identity verification
  - `id_photo_url` (text, nullable) — URL to scanned photo of the ID document
  - `whatsapp` (text, nullable) — WhatsApp number or username for direct messaging
- `trips`
  - `driver_license_scan_url` (text, nullable) — URL to scanned driver license photo, captured per load acceptance

2. Security
- No new tables. Existing RLS policies on profiles (owner-scoped) and trips (anon+authenticated) remain unchanged.
- The new columns inherit the same column-level privileges as their parent tables.

3. Notes
- All new columns are nullable so existing rows are not affected.
- `id_number` and `id_photo_url` are required at registration time by the frontend, but the database allows null for backward compatibility with existing profiles.
- `driver_license_scan_url` is set each time a driver accepts a load, creating a per-load audit trail of license verification.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_photo_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp text;

ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_license_scan_url text;
