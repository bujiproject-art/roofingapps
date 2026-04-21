-- Complete Row Level Security policies for all tables

-- Clients policies
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role IN ('manager', 'admin')
    )
  );

-- Inspections policies
CREATE POLICY "Users can view own inspections" ON inspections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create inspections" ON inspections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspections" ON inspections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team inspections" ON inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role IN ('manager', 'admin')
    )
  );

-- Inspection photos policies
CREATE POLICY "Users can view photos from own inspections" ON inspection_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i 
      WHERE i.id = inspection_photos.inspection_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload photos to own inspections" ON inspection_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections i 
      WHERE i.id = inspection_photos.inspection_id AND i.user_id = auth.uid()
    )
  );

-- Damage annotations policies
CREATE POLICY "Users can view annotations on own photos" ON damage_annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspection_photos ip
      JOIN inspections i ON i.id = ip.inspection_id
      WHERE ip.id = damage_annotations.photo_id AND i.user_id = auth.uid()
    )
  );

-- Voice notes policies
CREATE POLICY "Users can view own voice notes" ON voice_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i 
      WHERE i.id = voice_notes.inspection_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create voice notes" ON voice_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections i 
      WHERE i.id = voice_notes.inspection_id AND i.user_id = auth.uid()
    )
  );

-- Reports policies
CREATE POLICY "Users can view reports from own inspections" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inspections i 
      WHERE i.id = reports.inspection_id AND i.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections i 
      WHERE i.id = reports.inspection_id AND i.user_id = auth.uid()
    )
  );

-- Follow-ups policies
CREATE POLICY "Users can view own follow-ups" ON follow_ups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create follow-ups" ON follow_ups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow-ups" ON follow_ups
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view subscriptions for own clients" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = subscriptions.client_id AND c.user_id = auth.uid()
    )
  );

-- Weather events policies (public read)
CREATE POLICY "Anyone can view weather events" ON weather_events
  FOR SELECT USING (true);

-- Performance metrics policies
CREATE POLICY "Users can view own metrics" ON performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Managers can view team metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role IN ('manager', 'admin')
    )
  );

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspections_company_id ON inspections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id_created ON clients(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_events_location_date ON weather_events(latitude, longitude, event_date);