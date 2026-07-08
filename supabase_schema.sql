-- ==========================================
-- GymOS Supabase Primary Database Schema
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. Create the 'gyms' table
CREATE TABLE IF NOT EXISTS gyms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id TEXT,
  owner_name TEXT,
  email TEXT,
  password_hash TEXT,
  password_plain TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  subscription_status TEXT DEFAULT 'active',
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  country TEXT DEFAULT 'United States',
  currency TEXT DEFAULT 'USD'
);

-- 2. Create the 'user_profiles' table
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  password_hash TEXT,
  password_plain TEXT,
  role TEXT NOT NULL DEFAULT 'gym_owner',
  gym_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the 'members' table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  gym_name TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT,
  height NUMERIC,
  weight NUMERIC,
  joining_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  membership_plan TEXT NOT NULL DEFAULT 'monthly',
  membership_price NUMERIC,
  expiry_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  profile_photo_url TEXT,
  emergency_contact TEXT,
  address TEXT,
  medical_notes TEXT,
  additional_notes TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create the 'payments' table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  member_id TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'upi',
  date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create the 'activities' table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create the 'settings' table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  whatsapp_template_30 TEXT,
  whatsapp_template_7 TEXT,
  whatsapp_template_3 TEXT,
  whatsapp_template_0 TEXT,
  whatsapp_template_expired TEXT,
  supabase_url TEXT,
  supabase_anon_key TEXT
);

-- 7. Create the 'reminders' table
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  member_id TEXT,
  member_name TEXT,
  expiry_days INTEGER,
  status TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  message TEXT
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create unrestricted RLS policies for GymOS API access
DROP POLICY IF EXISTS "Enable all access for GymOS API" ON gyms;
CREATE POLICY "Enable all access for GymOS API" ON gyms FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for GymOS API" ON user_profiles;
CREATE POLICY "Enable all access for GymOS API" ON user_profiles FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for GymOS API" ON members;
CREATE POLICY "Enable all access for GymOS API" ON members FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for GymOS API" ON payments;
CREATE POLICY "Enable all access for GymOS API" ON payments FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for GymOS API" ON activities;
CREATE POLICY "Enable all access for GymOS API" ON activities FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for GymOS API" ON settings;
CREATE POLICY "Enable all access for GymOS API" ON settings FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for GymOS API" ON reminders;
CREATE POLICY "Enable all access for GymOS API" ON reminders FOR ALL TO public USING (true) WITH CHECK (true);

-- Create indexes to optimize multi-tenant query speeds
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members (gym_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members (status);
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON payments (gym_id);
CREATE INDEX IF NOT EXISTS idx_activities_gym_id ON activities (gym_id);
