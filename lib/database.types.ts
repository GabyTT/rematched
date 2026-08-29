export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ingestion_runs: {
        Row: {
          created_at: string
          duplicate_warnings: number
          finished_at: string | null
          id: string
          listing_source_id: string
          listings_fetched: number
          listings_normalized: number
          parser_errors: number
          manual_import_type: string | null
          run_notes: string | null
          source_listing_date: string | null
          source_listing_ids: Json
          source_listings_found: number | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duplicate_warnings?: number
          finished_at?: string | null
          id?: string
          listing_source_id: string
          listings_fetched?: number
          listings_normalized?: number
          parser_errors?: number
          manual_import_type?: string | null
          run_notes?: string | null
          source_listing_date?: string | null
          source_listing_ids?: Json
          source_listings_found?: number | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duplicate_warnings?: number
          finished_at?: string | null
          id?: string
          listing_source_id?: string
          listings_fetched?: number
          listings_normalized?: number
          parser_errors?: number
          manual_import_type?: string | null
          run_notes?: string | null
          source_listing_date?: string | null
          source_listing_ids?: Json
          source_listings_found?: number | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_runs_listing_source_id_fkey"
            columns: ["listing_source_id"]
            isOneToOne: false
            referencedRelation: "listing_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_sources: {
        Row: {
          base_url: string | null
          created_at: string
          id: string
          ingestion_enabled: boolean
          ingestion_mode: string
          notes: string | null
          scheduled_run_time: string
          source_name: string
          source_type: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: string
          ingestion_enabled?: boolean
          ingestion_mode?: string
          notes?: string | null
          scheduled_run_time?: string
          source_name: string
          source_type: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: string
          ingestion_enabled?: boolean
          ingestion_mode?: string
          notes?: string | null
          scheduled_run_time?: string
          source_name?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      normalized_listing_images: {
        Row: {
          created_at: string
          display_order: number
          display_url: string
          id: string
          is_primary: boolean
          normalized_listing_id: string
          preview_allowed: boolean
          raw_listing_image_id: string | null
          source_attribution_required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          display_url: string
          id?: string
          is_primary?: boolean
          normalized_listing_id: string
          preview_allowed?: boolean
          raw_listing_image_id?: string | null
          source_attribution_required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          display_url?: string
          id?: string
          is_primary?: boolean
          normalized_listing_id?: string
          preview_allowed?: boolean
          raw_listing_image_id?: string | null
          source_attribution_required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "normalized_listing_images_normalized_listing_id_fkey"
            columns: ["normalized_listing_id"]
            isOneToOne: false
            referencedRelation: "normalized_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normalized_listing_images_raw_listing_image_id_fkey"
            columns: ["raw_listing_image_id"]
            isOneToOne: false
            referencedRelation: "raw_listing_images"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_workflow_events: {
        Row: {
          contact_method: string | null
          colour: string | null
          created_at: string
          expected_assets_at: string | null
          event_type: string
          follow_up_at: string | null
          follow_up_overridden: boolean
          id: string
          next_workflow_status: string
          normalized_listing_id: string
          notes: string | null
          occurred_at: string
          previous_workflow_status: string | null
          seller_contact_outcome: string | null
        }
        Insert: {
          contact_method?: string | null
          created_at?: string
          expected_assets_at?: string | null
          event_type: string
          follow_up_at?: string | null
          follow_up_overridden?: boolean
          id?: string
          next_workflow_status: string
          normalized_listing_id: string
          notes?: string | null
          occurred_at?: string
          previous_workflow_status?: string | null
          seller_contact_outcome?: string | null
        }
        Update: {
          contact_method?: string | null
          created_at?: string
          expected_assets_at?: string | null
          event_type?: string
          follow_up_at?: string | null
          follow_up_overridden?: boolean
          id?: string
          next_workflow_status?: string
          normalized_listing_id?: string
          notes?: string | null
          occurred_at?: string
          previous_workflow_status?: string | null
          seller_contact_outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_workflow_events_normalized_listing_id_fkey"
            columns: ["normalized_listing_id"]
            isOneToOne: false
            referencedRelation: "normalized_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      normalized_listings: {
        Row: {
          availability_status: string
          body_type: string | null
          brand_name: string | null
          buyer_visibility_reason: string | null
          contact_method: string | null
          colour: string | null
          created_at: string
          display_name: string
          engine_size: string | null
          fuel_type: string | null
          id: string
          import_status: string | null
          is_negotiable: boolean
          is_buyer_visible: boolean
          listing_source_id: string | null
          location_label: string | null
          mileage_value: number | null
          model_name: string | null
          normalization_confidence: number | null
          plate_series: string | null
          price_amount: number | null
          public_contact_name: string | null
          public_contact_phone: string | null
          raw_listing_id: string | null
          recommendation_state: string
          review_status: string
          seller_type: string | null
          source_attribution_required: boolean
          source_images_allowed_for_preview: boolean
          source_listing_id: string | null
          source_listing_url: string | null
          source_missing_at: string | null
          source_missing_run_id: string | null
          sold_at: string | null
          title: string | null
          transmission_type: string | null
          trim_name: string | null
          updated_at: string
          workflow_status: string
          year: number | null
        }
        Insert: {
          availability_status?: string
          body_type?: string | null
          brand_name?: string | null
          buyer_visibility_reason?: string | null
          contact_method?: string | null
          colour?: string | null
          created_at?: string
          display_name: string
          engine_size?: string | null
          fuel_type?: string | null
          id?: string
          import_status?: string | null
          is_negotiable?: boolean
          is_buyer_visible?: boolean
          listing_source_id?: string | null
          location_label?: string | null
          mileage_value?: number | null
          model_name?: string | null
          normalization_confidence?: number | null
          plate_series?: string | null
          price_amount?: number | null
          public_contact_name?: string | null
          public_contact_phone?: string | null
          raw_listing_id?: string | null
          recommendation_state?: string
          review_status?: string
          seller_type?: string | null
          source_attribution_required?: boolean
          source_images_allowed_for_preview?: boolean
          source_listing_id?: string | null
          source_listing_url?: string | null
          source_missing_at?: string | null
          source_missing_run_id?: string | null
          sold_at?: string | null
          title?: string | null
          transmission_type?: string | null
          trim_name?: string | null
          updated_at?: string
          workflow_status?: string
          year?: number | null
        }
        Update: {
          availability_status?: string
          body_type?: string | null
          brand_name?: string | null
          buyer_visibility_reason?: string | null
          contact_method?: string | null
          colour?: string | null
          created_at?: string
          display_name?: string
          engine_size?: string | null
          fuel_type?: string | null
          id?: string
          import_status?: string | null
          is_negotiable?: boolean
          is_buyer_visible?: boolean
          listing_source_id?: string | null
          location_label?: string | null
          mileage_value?: number | null
          model_name?: string | null
          normalization_confidence?: number | null
          plate_series?: string | null
          price_amount?: number | null
          public_contact_name?: string | null
          public_contact_phone?: string | null
          raw_listing_id?: string | null
          recommendation_state?: string
          review_status?: string
          seller_type?: string | null
          source_attribution_required?: boolean
          source_images_allowed_for_preview?: boolean
          source_listing_id?: string | null
          source_listing_url?: string | null
          source_missing_at?: string | null
          source_missing_run_id?: string | null
          sold_at?: string | null
          title?: string | null
          transmission_type?: string | null
          trim_name?: string | null
          updated_at?: string
          workflow_status?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "normalized_listings_listing_source_id_fkey"
            columns: ["listing_source_id"]
            isOneToOne: false
            referencedRelation: "listing_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normalized_listings_raw_listing_id_fkey"
            columns: ["raw_listing_id"]
            isOneToOne: false
            referencedRelation: "raw_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_profile_brands: {
        Row: {
          brand_name: string
          brand_name_normalized: string | null
          created_at: string
          id: string
          preference_profile_id: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          brand_name_normalized?: string | null
          created_at?: string
          id?: string
          preference_profile_id: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          brand_name_normalized?: string | null
          created_at?: string
          id?: string
          preference_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preference_profile_brands_preference_profile_id_fkey"
            columns: ["preference_profile_id"]
            isOneToOne: false
            referencedRelation: "preference_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_profiles: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          id: string
          is_active: boolean
          model_query: string | null
          profile_id: string
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          model_query?: string | null
          profile_id: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          model_query?: string | null
          profile_id?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preference_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_access_codes: {
        Row: {
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          seller_account_id: string
          updated_at: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          seller_account_id: string
          updated_at?: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          seller_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_access_codes_seller_account_id_fkey"
            columns: ["seller_account_id"]
            isOneToOne: true
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          phone_e164: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone_e164: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          phone_e164?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_listing_submissions: {
        Row: {
          additional_info: string | null
          admin_review_note: string | null
          admin_review_status: string
          admin_reviewed_at: string | null
          body_type: string | null
          brand_name: string | null
          colour: string | null
          confirmation_accepted_at: string | null
          created_at: string
          display_name: string
          engine_size: string | null
          features: string
          fuel_type: string | null
          id: string
          location_label: string | null
          mileage_value: number | null
          model_name: string | null
          normalized_listing_id: string
          pending_review_at: string | null
          is_negotiable: boolean
          plate_series: string | null
          price_amount: number | null
          publication_consent_accepted_at: string | null
          public_contact_name: string | null
          public_contact_phone: string | null
          seller_account_id: string
          status: string
          submitted_at: string | null
          transmission_type: string | null
          trim_name: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          additional_info?: string | null
          admin_review_note?: string | null
          admin_review_status?: string
          admin_reviewed_at?: string | null
          body_type?: string | null
          brand_name?: string | null
          colour?: string | null
          confirmation_accepted_at?: string | null
          created_at?: string
          display_name: string
          engine_size?: string | null
          features?: string
          fuel_type?: string | null
          id?: string
          location_label?: string | null
          mileage_value?: number | null
          model_name?: string | null
          normalized_listing_id: string
          pending_review_at?: string | null
          is_negotiable?: boolean
          plate_series?: string | null
          price_amount?: number | null
          publication_consent_accepted_at?: string | null
          public_contact_name?: string | null
          public_contact_phone?: string | null
          seller_account_id: string
          status?: string
          submitted_at?: string | null
          transmission_type?: string | null
          trim_name?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          additional_info?: string | null
          admin_review_note?: string | null
          admin_review_status?: string
          admin_reviewed_at?: string | null
          body_type?: string | null
          brand_name?: string | null
          colour?: string | null
          confirmation_accepted_at?: string | null
          created_at?: string
          display_name?: string
          engine_size?: string | null
          features?: string
          fuel_type?: string | null
          id?: string
          location_label?: string | null
          mileage_value?: number | null
          model_name?: string | null
          normalized_listing_id?: string
          pending_review_at?: string | null
          is_negotiable?: boolean
          plate_series?: string | null
          price_amount?: number | null
          publication_consent_accepted_at?: string | null
          public_contact_name?: string | null
          public_contact_phone?: string | null
          seller_account_id?: string
          status?: string
          submitted_at?: string | null
          transmission_type?: string | null
          trim_name?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_listing_submissions_normalized_listing_id_fkey"
            columns: ["normalized_listing_id"]
            isOneToOne: true
            referencedRelation: "normalized_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_listing_submissions_seller_account_id_fkey"
            columns: ["seller_account_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_listing_media_assets: {
        Row: {
          approval_status: string
          content_type: string
          created_at: string
          file_size_bytes: number
          id: string
          is_preferred_main: boolean
          normalized_listing_id: string
          original_filename: string
          requested_action: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seller_account_id: string
          storage_path: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          approval_status?: string
          content_type: string
          created_at?: string
          file_size_bytes: number
          id?: string
          is_preferred_main?: boolean
          normalized_listing_id: string
          original_filename: string
          requested_action?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_account_id: string
          storage_path: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          approval_status?: string
          content_type?: string
          created_at?: string
          file_size_bytes?: number
          id?: string
          is_preferred_main?: boolean
          normalized_listing_id?: string
          original_filename?: string
          requested_action?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_account_id?: string
          storage_path?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_listing_media_assets_normalized_listing_id_fkey"
            columns: ["normalized_listing_id"]
            isOneToOne: false
            referencedRelation: "normalized_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_listing_media_assets_seller_account_id_fkey"
            columns: ["seller_account_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_listing_assignments: {
        Row: {
          created_at: string
          id: string
          normalized_listing_id: string
          seller_account_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          normalized_listing_id: string
          seller_account_id: string
        }
        Update: {
          created_at?: string
          id?: string
          normalized_listing_id?: string
          seller_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_listing_assignments_normalized_listing_id_fkey"
            columns: ["normalized_listing_id"]
            isOneToOne: false
            referencedRelation: "normalized_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_listing_assignments_seller_account_id_fkey"
            columns: ["seller_account_id"]
            isOneToOne: false
            referencedRelation: "seller_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_listing_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          preview_allowed: boolean
          raw_listing_id: string
          source_attribution_required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          preview_allowed?: boolean
          raw_listing_id: string
          source_attribution_required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          preview_allowed?: boolean
          raw_listing_id?: string
          source_attribution_required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_listing_images_raw_listing_id_fkey"
            columns: ["raw_listing_id"]
            isOneToOne: false
            referencedRelation: "raw_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_listings: {
        Row: {
          created_at: string
          fetched_at: string
          id: string
          ingestion_run_id: string | null
          listing_source_id: string
          raw_contact_text: string | null
          raw_colour_text: string | null
          raw_description: string | null
          raw_engine_size_text: string | null
          raw_fuel_text: string | null
          raw_features_text: string | null
          raw_is_negotiable: boolean
          raw_location_text: string | null
          raw_mileage_text: string | null
          raw_payload: Json
          raw_price_text: string | null
          raw_plate_series_text: string | null
          raw_seller_label: string | null
          raw_title: string | null
          raw_transmission_text: string | null
          raw_trim_text: string | null
          source_posted_at: string | null
          source_posted_text: string | null
          source_refreshed_at: string | null
          source_refreshed_text: string | null
          source_listing_id: string | null
          source_listing_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fetched_at?: string
          id?: string
          ingestion_run_id?: string | null
          listing_source_id: string
          raw_contact_text?: string | null
          raw_colour_text?: string | null
          raw_description?: string | null
          raw_engine_size_text?: string | null
          raw_fuel_text?: string | null
          raw_features_text?: string | null
          raw_is_negotiable?: boolean
          raw_location_text?: string | null
          raw_mileage_text?: string | null
          raw_payload?: Json
          raw_price_text?: string | null
          raw_plate_series_text?: string | null
          raw_seller_label?: string | null
          raw_title?: string | null
          raw_transmission_text?: string | null
          raw_trim_text?: string | null
          source_posted_at?: string | null
          source_posted_text?: string | null
          source_refreshed_at?: string | null
          source_refreshed_text?: string | null
          source_listing_id?: string | null
          source_listing_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fetched_at?: string
          id?: string
          ingestion_run_id?: string | null
          listing_source_id?: string
          raw_contact_text?: string | null
          raw_colour_text?: string | null
          raw_description?: string | null
          raw_engine_size_text?: string | null
          raw_fuel_text?: string | null
          raw_features_text?: string | null
          raw_is_negotiable?: boolean
          raw_location_text?: string | null
          raw_mileage_text?: string | null
          raw_payload?: Json
          raw_price_text?: string | null
          raw_plate_series_text?: string | null
          raw_seller_label?: string | null
          raw_title?: string | null
          raw_transmission_text?: string | null
          raw_trim_text?: string | null
          source_posted_at?: string | null
          source_posted_text?: string | null
          source_refreshed_at?: string | null
          source_refreshed_text?: string | null
          source_listing_id?: string | null
          source_listing_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_listings_ingestion_run_id_fkey"
            columns: ["ingestion_run_id"]
            isOneToOne: false
            referencedRelation: "ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_listings_listing_source_id_fkey"
            columns: ["listing_source_id"]
            isOneToOne: false
            referencedRelation: "listing_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      buyer_visible_listings: {
        Row: {
          body_type: string | null
          brand_name: string | null
          colour: string | null
          display_name: string
          engine_size: string | null
          fuel_type: string | null
          id: string
          is_negotiable: boolean
          location_label: string | null
          mileage_value: number | null
          model_name: string | null
          price_amount: number | null
          plate_series: string | null
          public_contact_name: string | null
          public_contact_phone: string | null
          raw_listing_id: string | null
          availability_status: string
          sold_at: string | null
          transmission_type: string | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
