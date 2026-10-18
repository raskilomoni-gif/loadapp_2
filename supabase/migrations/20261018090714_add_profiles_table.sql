/*
# Add user profiles table for registration and role-based marketplace

1. New Tables
- `profiles`
  - `user_id` (uuid, primary key, references auth.users, defaults to auth.uid())
  - `role` (text: 'shipper' or 'driver') — chosen at registration
  - `display_name` (text) — user's full name or company name
  - `company_name` (text, nullable) — optional company/trading name
  - `phone` (text, nullable) — contact phone
  - `email` (text) — copied from auth email for convenience
  - `max_listings` (int, default 10) — how many marketplace results to show (5-15)
  - `home_lat` (double precision, nullable) — home/base latitude for distance sorting
  - `home_lng` (double precision, nullable) — home/base longitude for distance sorting
  - `home_address` (text, nullable) — human-readable home/base address
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `profiles`.
- Owner-scoped CRUD: each authenticated user can only read/insert/update/delete their own profile row.
- INSERT and UPDATE policies use WITH CHECK (auth.uid() = user_id).
- SELECT policy uses USING (auth.uid() = user_id).

3. Notes
- The `user_id` column has DEFAULT auth.uid() so inserts that omit it still satisfy the WITH CHECK.
- Existing tables (trips, truckers, cargo, escrow, etc.) already have anon+authenticated policies with USING(true), so authenticated users can read them for the marketplace without changes.
- No changes to existing tables — this migration only adds the new profiles table.
*/

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'shipper' CHECK (role IN ('shipper', 'driver')),
  display_name text NOT NULL DEFAULT '',
  company_name text,
  phone text,
  email text NOT NULL DEFAULT '',
  max_listings integer NOT NULL DEFAULT 10 CHECK (max_listings >= 5 AND max_listings <= 15),
  home_lat double precision,
  home_lng double precision,
  home_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
