export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'rep' | 'manager' | 'admin'
          company_id: string | null
          phone_number: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          last_active_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      properties: {
        Row: {
          id: string
          user_id: string
          address: string
          city: string
          state: string
          zip_code: string
          latitude: number | null
          longitude: number | null
          roof_type: 'shingles' | 'tpo' | 'epdm' | 'metal' | 'flat' | 'other' | null
          roof_age: number | null
          square_feet: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      clients: {
        Row: {
          id: string
          user_id: string
          property_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone_number: string
          preferred_contact: 'sms' | 'email' | 'both'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      inspections: {
        Row: {
          id: string
          user_id: string
          property_id: string
          client_id: string | null
          status: 'draft' | 'pending_analysis' | 'analyzed' | 'report_sent' | 'follow_up' | 'closed'
          overall_risk_score: number | null
          risk_level: 'low' | 'medium' | 'high' | null
          ai_confidence_score: number | null
          missing_shingles_count: number
          granule_loss_severity: number | null
          flashing_condition: 'good' | 'fair' | 'poor' | null
          gutter_condition: 'good' | 'fair' | 'poor' | null
          moss_algae_present: boolean
          repair_urgency: 'immediate' | 'within_30_days' | 'within_6_months' | 'monitor' | null
          estimated_repair_cost: number | null
          estimated_replacement_cost: number | null
          report_generated_at: string | null
          report_delivered_via: string[] | null
          inspection_date: string
          weather_conditions: string | null
          temperature: number | null
          gps_accuracy: number | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['inspections']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inspections']['Insert']>
      }
      inspection_photos: {
        Row: {
          id: string
          inspection_id: string
          storage_path: string
          filename: string
          file_size: number | null
          mime_type: string | null
          image_width: number | null
          image_height: number | null
          capture_direction: 'north' | 'south' | 'east' | 'west' | 'close_up' | 'gutter' | 'other' | null
          compass_bearing: number | null
          gyroscope_pitch: number | null
          gyroscope_roll: number | null
          has_damage: boolean
          damage_types: string[] | null
          ai_confidence: number | null
          analysis_completed_at: string | null
          created_at: string
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['inspection_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['inspection_photos']['Insert']>
      }
      damage_annotations: {
        Row: {
          id: string
          photo_id: string
          damage_type: 'missing_shingle' | 'cracked_shingle' | 'granule_loss' | 'flashing_damage' | 'gutter_damage' | 'moss' | 'algae' | 'other'
          severity: 'low' | 'medium' | 'high'
          x_percent: number
          y_percent: number
          width_percent: number
          height_percent: number
          ai_confidence: number | null
          description: string | null
          repair_recommendation: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['damage_annotations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['damage_annotations']['Insert']>
      }
      voice_notes: {
        Row: {
          id: string
          inspection_id: string
          audio_storage_path: string | null
          transcript: string | null
          transcription_confidence: number | null
          duration_seconds: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['voice_notes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['voice_notes']['Insert']>
      }
      reports: {
        Row: {
          id: string
          inspection_id: string
          report_type: 'client' | 'internal' | 'insurance'
          storage_path: string | null
          pdf_url: string | null
          file_size: number | null
          sent_via: string[] | null
          sent_to_email: string | null
          sent_to_phone: string | null
          delivery_status: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened'
          opened_at: string | null
          opened_count: number
          created_at: string
          generated_at: string
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at' | 'generated_at'>
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
      follow_ups: {
        Row: {
          id: string
          inspection_id: string
          user_id: string
          client_id: string
          follow_up_type: 'call' | 'email' | 'sms' | 'in_person'
          scheduled_for: string
          completed_at: string | null
          notes: string | null
          outcome: 'contacted' | 'left_message' | 'no_answer' | 'scheduled' | 'closed' | 'lost' | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['follow_ups']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['follow_ups']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          client_id: string
          property_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          plan_type: 'annual' | 'bi_annual' | 'quarterly'
          price_cents: number
          status: 'active' | 'past_due' | 'canceled' | 'expired'
          start_date: string
          end_date: string
          next_billing_date: string | null
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      weather_events: {
        Row: {
          id: string
          event_type: 'hail' | 'storm' | 'high_wind' | 'heavy_rain'
          severity: 'light' | 'moderate' | 'severe'
          latitude: number
          longitude: number
          radius_miles: number
          city: string
          state: string
          event_date: string
          max_wind_speed_mph: number | null
          hail_size_inches: number | null
          properties_affected: number
          alerts_sent: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['weather_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weather_events']['Insert']>
      }
      performance_metrics: {
        Row: {
          id: string
          user_id: string
          period_start: string
          period_end: string
          inspections_completed: number
          reports_sent: number
          close_rate: number | null
          average_risk_score: number | null
          revenue_generated_cents: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['performance_metrics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['performance_metrics']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}