-- ==========================================
-- GymOS Supabase Replication Database Schema
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- Create the 'members' table for real-time synchronization
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

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create an unrestricted RLS policy for easy API synchronization (or restrict it to authenticated users if needed)
CREATE POLICY "Enable all access for GymOS API"
  ON members
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create index on gym_id to optimize multi-tenant query speeds
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members (gym_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members (status);
