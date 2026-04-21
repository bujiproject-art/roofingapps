-- RevoRoof AI Pro Suite Database Schema
-- Created: 2025-01-15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'rep' CHECK (role IN ('rep', 'manager', 'admin')),
  company_id TEXT DEFAULT 'revolution_roofing',
  phone_number TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  roof_type TEXT CHECK (roof_type IN ('shingles', 'tpo', 'epdm', 'metal', 'flat', 'other')),
  roof_age INTEGER,
  square_feet DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_coordinates CHECK (
    (latitude BETWEEN -90 AND 90) AND 
    (longitude BETWEEN -180 AND 180)
  )
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT NOT NULL,
  preferred_contact TEXT DEFAULT 'sms' CHECK (preferred_contact IN ('sms', 'email', 'both')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'pending_analysis', 'analyzed', 'report_sent', 'follow_up', 'closed')),
  
  -- AI Analysis Results
  overall_risk_score INTEGER CHECK (overall_risk_score BETWEEN 1 AND 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  ai_confidence_score DECIMAL(4, 2) CHECK (ai_confidence_score BETWEEN 0 AND 100),
  
  -- Damage Details
  missing_shingles_count INTEGER DEFAULT 0,
  granule_loss_severity INTEGER CHECK (granule_loss_severity BETWEEN 1 AND 5),
  flashing_condition TEXT CHECK (flashing_condition IN ('good', 'fair', 'poor')),
  gutter_condition TEXT CHECK (gutter_condition IN ('good', 'fair', 'poor')),
  moss_algae_present BOOLEAN DEFAULT false,
  
  -- Recommendations
  repair_urgency TEXT CHECK (repair_urgency IN ('immediate', 'within_30_days', 'within_6_months', 'monitor')),
  estimated_repair_cost DECIMAL(10, 2),
  estimated_replacement_cost DECIMAL(10, 2),
  
  -- Report Details
  report_generated_at TIMESTAMP WITH TIME ZONE,
  report_delivered_via TEXT[],
  
  -- Metadata
  inspection_date DATE DEFAULT CURRENT_DATE,
  weather_conditions TEXT,
  temperature DECIMAL(5, 2),
  gps_accuracy DECIMAL(5, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT valid_dates CHECK (completed_at >= created_at)
);

-- Inspection Photos table
CREATE TABLE IF NOT EXISTS inspection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  image_width INTEGER,
  image_height INTEGER,
  
  -- Photo Metadata
  capture_direction TEXT CHECK (capture_direction IN ('north', 'south', 'east', 'west', 'close_up', 'gutter', 'other')),
  compass_bearing DECIMAL(5, 2),
  gyroscope_pitch DECIMAL(5, 2),
  gyroscope_roll DECIMAL(5, 2),
  
  -- AI Analysis
  has_damage BOOLEAN DEFAULT false,
  damage_types TEXT[],
  ai_confidence DECIMAL(4, 2) CHECK (ai_confidence BETWEEN 0 AND 100),
  analysis_completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0
);

-- Damage Annotations table
CREATE TABLE IF NOT EXISTS damage_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID REFERENCES inspection_photos(id) ON DELETE CASCADE,
  damage_type TEXT NOT NULL CHECK (damage_type IN ('missing_shingle', 'cracked_shingle', 'granule_loss', 'flashing_damage', 'gutter_damage', 'moss', 'algae', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  
  -- Coordinates (percentage of image dimensions)
  x_percent DECIMAL(5, 2) CHECK (x_percent BETWEEN 0 AND 100),
  y_percent DECIMAL(5, 2) CHECK (y_percent BETWEEN 0 AND 100),
  width_percent DECIMAL(5, 2) CHECK (width_percent BETWEEN 0 AND 100),
  height_percent DECIMAL(5, 2) CHECK (height_percent BETWEEN 0 AND 100),
  
  -- AI Data
  ai_confidence DECIMAL(4, 2) CHECK (ai_confidence BETWEEN 0 AND 100),
  description TEXT,
  repair_recommendation TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Notes table
CREATE TABLE IF NOT EXISTS voice_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  audio_storage_path TEXT,
  transcript TEXT,
  transcription_confidence DECIMAL(4, 2) CHECK (transcription_confidence BETWEEN 0 AND 100),
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL DEFAULT 'client' CHECK (report_type IN ('client', 'internal', 'insurance')),
  
  -- Storage
  storage_path TEXT,
  pdf_url TEXT,
  file_size INTEGER,
  
  -- Delivery
  sent_via TEXT[],
  sent_to_email TEXT,
  sent_to_phone TEXT,
  delivery_status TEXT DEFAULT 'pending' 
    CHECK (delivery_status IN ('pending', 'sent', 'failed', 'delivered', 'opened')),
  
  -- Tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  opened_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID REFERENCES inspections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN ('call', 'email', 'sms', 'in_person')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  outcome TEXT CHECK (outcome IN ('contacted', 'left_message', 'no_answer', 'scheduled', 'closed', 'lost')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table (for annual roof health)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  
  plan_type TEXT NOT NULL DEFAULT 'annual' CHECK (plan_type IN ('annual', 'bi_annual', 'quarterly')),
  price_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  next_billing_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather Events table
CREATE TABLE IF NOT EXISTS weather_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN ('hail', 'storm', 'high_wind', 'heavy_rain')),
  severity TEXT NOT NULL CHECK (severity IN ('light', 'moderate', 'severe')),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_miles DECIMAL(5, 2) NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  
  event_date DATE NOT NULL,
  max_wind_speed_mph DECIMAL(5, 2),
  hail_size_inches DECIMAL(3, 2),
  
  -- Tracking
  properties_affected INTEGER DEFAULT 0,
  alerts_sent INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_coordinates_weather CHECK (
    (latitude BETWEEN -90 AND 90) AND 
    (longitude BETWEEN -180 AND 180)
  )
);

-- Performance Metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metrics
  inspections_completed INTEGER DEFAULT 0,
  reports_sent INTEGER DEFAULT 0,
  close_rate DECIMAL(4, 2) CHECK (close_rate BETWEEN 0 AND 100),
  average_risk_score DECIMAL(4, 2) CHECK (average_risk_score BETWEEN 1 AND 100),
  revenue_generated_cents INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, period_start, period_end)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_property_id ON inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_risk_level ON inspections(risk_level);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_property_id ON clients(property_id);

CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_id ON inspection_photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_damage_annotations_photo_id ON damage_annotations(photo_id);

CREATE INDEX IF NOT EXISTS idx_follow_ups_inspection_id ON follow_ups(inspection_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_for ON follow_ups(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_weather_events_event_date ON weather_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_weather_events_location ON weather_events(latitude, longitude);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Managers can view team members" ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role IN ('manager', 'admin')
    )
  );

-- Properties policies
CREATE POLICY "Users can view own properties" ON properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team properties" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role IN ('manager', 'admin')
      AND u.company_id = properties.company_id
    )
  );

-- Similar policies for other tables following the same pattern
-- (Creating policies for all tables, but showing sample for clarity)

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON follow_ups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();