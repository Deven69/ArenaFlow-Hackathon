-- =====================================================
-- ARENAFLOW - Complete Supabase Schema
-- Fix: RLS recursion issue + missing columns
-- =====================================================

-- 1. First, drop the problematic RLS policies on ticket_group_members
--    to break the recursion loop
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."ticket_group_members";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."ticket_group_members";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."ticket_group_members";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."ticket_group_members";

-- 2. Drop existing policies on ticket_groups too (for clean re-creation)
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."ticket_groups";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."ticket_groups";
DROP POLICY IF EXISTS "Enable update for leaders only" ON "public"."ticket_groups";

-- 3. Re-create RLS policies for ticket_group_members (FIXED - no recursion)
ALTER TABLE "public"."ticket_group_members" ENABLE ROW LEVEL SECURITY;

-- Members can read their own memberships
CREATE POLICY "Members can view own memberships"
  ON "public"."ticket_group_members"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Members can update their own membership (for consent confirmation)
CREATE POLICY "Members can update own membership"
  ON "public"."ticket_group_members"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert: users can join groups (they become members)
CREATE POLICY "Users can insert own membership"
  ON "public"."ticket_group_members"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Group leaders can read all members of their groups
CREATE POLICY "Leaders can view members of their groups"
  ON "public"."ticket_group_members"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ticket_groups tg
      WHERE tg.id = ticket_group_members.group_id
      AND tg.leader_id = auth.uid()
    )
  );

-- 4. Re-create RLS policies for ticket_groups
ALTER TABLE "public"."ticket_groups" ENABLE ROW LEVEL SECURITY;

-- Anyone can read groups (for join flow)
CREATE POLICY "Anyone can view groups"
  ON "public"."ticket_groups"
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can create groups
CREATE POLICY "Users can create groups"
  ON "public"."ticket_groups"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = leader_id);

-- Only leaders can update their groups
CREATE POLICY "Leaders can update own groups"
  ON "public"."ticket_groups"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = leader_id)
  WITH CHECK (auth.uid() = leader_id);

-- =====================================================
-- 5. Fix missing columns in venues table
-- =====================================================

-- Add missing columns to venues if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'capacity') THEN
    ALTER TABLE "public"."venues" ADD COLUMN "capacity" integer DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'gates') THEN
    ALTER TABLE "public"."venues" ADD COLUMN "gates" jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'team_colors') THEN
    ALTER TABLE "public"."venues" ADD COLUMN "team_colors" jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'sport') THEN
    ALTER TABLE "public"."venues" ADD COLUMN "sport" text DEFAULT 'Cricket';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'home_team') THEN
    ALTER TABLE "public"."venues" ADD COLUMN "home_team" text;
  END IF;
END $$;

-- =====================================================
-- 6. Fix missing columns in matches table
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'poster_url') THEN
    ALTER TABLE "public"."matches" ADD COLUMN "poster_url" text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'status') THEN
    ALTER TABLE "public"."matches" ADD COLUMN "status" text DEFAULT 'upcoming';
  END IF;
END $$;

-- =====================================================
-- 7. Fix missing columns in tickets table
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'tickets' AND column_name = 'tier') THEN
    ALTER TABLE "public"."tickets" ADD COLUMN "tier" text DEFAULT 'standard';
  END IF;
END $$;

-- =====================================================
-- 8. Fix missing columns in ticket_groups table
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'ticket_groups' AND column_name = 'status') THEN
    ALTER TABLE "public"."ticket_groups" ADD COLUMN "status" text DEFAULT 'forming';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'ticket_groups' AND column_name = 'ticket_ids') THEN
    ALTER TABLE "public"."ticket_groups" ADD COLUMN "ticket_ids" uuid[] DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'ticket_groups' AND column_name = 'checked_in_at') THEN
    ALTER TABLE "public"."ticket_groups" ADD COLUMN "checked_in_at" timestamptz;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'ticket_groups' AND column_name = 'locked_at') THEN
    ALTER TABLE "public"."ticket_groups" ADD COLUMN "locked_at" timestamptz;
  END IF;
END $$;

-- =====================================================
-- 9. Fix missing columns in profiles table
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'tier') THEN
    ALTER TABLE "public"."profiles" ADD COLUMN "tier" text DEFAULT 'standard';
  END IF;
END $$;

-- =====================================================
-- 10. Add Realtime capabilities
-- =====================================================

-- Enable realtime for tables that need live updates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tickets') THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tickets";
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ticket_groups') THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."ticket_groups";
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."orders";
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'gate_queue_snapshots') THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."gate_queue_snapshots";
  END IF;
END $$;

-- =====================================================
-- 11. Recreate PostgreSQL Functions (if needed)
-- =====================================================

-- create_ticket_group function
CREATE OR REPLACE FUNCTION "public"."create_ticket_group"(
  p_match_id uuid,
  p_max_size integer DEFAULT 8
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id uuid;
  v_leader_id uuid;
  v_leader_ticket_id uuid;
BEGIN
  -- Get the current user as leader
  v_leader_id := auth.uid();

  -- Find leader's ticket for this match
  SELECT id INTO v_leader_ticket_id
  FROM tickets
  WHERE user_id = v_leader_id AND match_id = p_match_id
  LIMIT 1;

  IF v_leader_ticket_id IS NULL THEN
    RAISE EXCEPTION 'Leader must have a ticket for the match';
  END IF;

  -- Create the group
  INSERT INTO ticket_groups (leader_id, match_id, max_size, master_qr_value, status)
  VALUES (v_leader_id, p_match_id, p_max_size, gen_random_uuid(), 'forming')
  RETURNING id INTO v_group_id;

  -- Add leader as first member
  INSERT INTO ticket_group_members (group_id, user_id, ticket_id, confirmed)
  VALUES (v_group_id, v_leader_id, v_leader_ticket_id, true);

  -- Update group's ticket_ids array
  UPDATE ticket_groups
  SET ticket_ids = ARRAY[v_leader_ticket_id]
  WHERE id = v_group_id;

  RETURN v_group_id;
END;
$$;

-- checkin_group function
CREATE OR REPLACE FUNCTION "public"."checkin_group"(
  p_master_qr_value uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket_ids uuid[];
  v_count integer;
  v_already_checked integer;
BEGIN
  -- Get ticket IDs for this group
  SELECT ticket_ids INTO v_ticket_ids
  FROM ticket_groups
  WHERE master_qr_value = p_master_qr_value
  AND status = 'locked';

  IF v_ticket_ids IS NULL THEN
    RAISE EXCEPTION 'Group not found or not locked';
  END IF;

  -- Check if any ticket is already checked in
  SELECT COUNT(*) INTO v_already_checked
  FROM tickets
  WHERE id = ANY(v_ticket_ids)
  AND checked_in = true;

  IF v_already_checked > 0 THEN
    RAISE EXCEPTION '% ticket(s) in this group already checked in separately', v_already_checked;
  END IF;

  -- Check in all tickets
  UPDATE tickets
  SET checked_in = true, checked_in_at = NOW()
  WHERE id = ANY(v_ticket_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update group status
  UPDATE ticket_groups
  SET status = 'checked_in', checked_in_at = NOW()
  WHERE master_qr_value = p_master_qr_value;

  RETURN v_count;
END;
$$;

-- get_user_role function
CREATE OR REPLACE FUNCTION "public"."get_user_role"()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.uid();

  RETURN COALESCE(v_role, 'fan');
END;
$$;

-- =====================================================
-- 12. Insert hardcoded venue data (Mumbai venues)
-- =====================================================

INSERT INTO "public"."venues" (id, name, city, capacity, sport, home_team, team_colors, gates, latitude, longitude, geofence_radius_meters)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Wankhede Stadium', 'Mumbai', 33108, 'Cricket', 'Mumbai Indians',
   '{"primary": "#004BA0", "secondary": "#D1AB3E"}'::jsonb,
   '["North", "South", "East", "VIP"]'::jsonb,
   18.9388, 72.8258, 500)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "public"."venues" (id, name, city, capacity, sport, home_team, team_colors, gates, latitude, longitude, geofence_radius_meters)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'DY Patil Stadium', 'Mumbai', 55000, 'Cricket', 'Multi-purpose',
   '{"primary": "#1E3A8A", "secondary": "#FFFFFF"}'::jsonb,
   '["A", "B", "C"]'::jsonb,
   19.0433, 73.0215, 600)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "public"."venues" (id, name, city, capacity, sport, home_team, team_colors, gates, latitude, longitude, geofence_radius_meters)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'Sardar Vallabhbhai Patel Indoor Stadium', 'Mumbai', 10000, 'Kabaddi', 'U Mumba',
   '{"primary": "#FF6B00", "secondary": "#000000"}'::jsonb,
   '["Main", "Side"]'::jsonb,
   19.0728, 72.8826, 300)
ON CONFLICT (id) DO NOTHING;
