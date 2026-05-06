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
          run_notes: string | null
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
          run_notes?: string | null
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
          run_notes?: string | null
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
          notes: string | null
          source_name: string
          source_type: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: string
          ingestion_enabled?: boolean
          notes?: string | null
          source_name: string
          source_type: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: string
          ingestion_enabled?: boolean
          notes?: string | null
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
      normalized_listings: {
        Row: {
          availability_status: string
          body_type: string | null
          brand_name: string | null
          buyer_visibility_reason: string | null
          contact_method: string | null
          created_at: string
          display_name: string
          fuel_type: string | null
          id: string
          import_status: string | null
          is_buyer_visible: boolean
          listing_source_id: string | null
          location_label: string | null
          mileage_value: number | null
          model_name: string | null
          normalization_confidence: number | null
          price_amount: number | null
          raw_listing_id: string | null
          recommendation_state: string
          review_status: string
          seller_type: string | null
          source_attribution_required: boolean
          source_images_allowed_for_preview: boolean
          source_listing_id: string | null
          source_listing_url: string | null
          title: string | null
          transmission_type: string | null
          trim_name: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          availability_status?: string
          body_type?: string | null
          brand_name?: string | null
          buyer_visibility_reason?: string | null
          contact_method?: string | null
          created_at?: string
          display_name: string
          fuel_type?: string | null
          id?: string
          import_status?: string | null
          is_buyer_visible?: boolean
          listing_source_id?: string | null
          location_label?: string | null
          mileage_value?: number | null
          model_name?: string | null
          normalization_confidence?: number | null
          price_amount?: number | null
          raw_listing_id?: string | null
          recommendation_state?: string
          review_status?: string
          seller_type?: string | null
          source_attribution_required?: boolean
          source_images_allowed_for_preview?: boolean
          source_listing_id?: string | null
          source_listing_url?: string | null
          title?: string | null
          transmission_type?: string | null
          trim_name?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          availability_status?: string
          body_type?: string | null
          brand_name?: string | null
          buyer_visibility_reason?: string | null
          contact_method?: string | null
          created_at?: string
          display_name?: string
          fuel_type?: string | null
          id?: string
          import_status?: string | null
          is_buyer_visible?: boolean
          listing_source_id?: string | null
          location_label?: string | null
          mileage_value?: number | null
          model_name?: string | null
          normalization_confidence?: number | null
          price_amount?: number | null
          raw_listing_id?: string | null
          recommendation_state?: string
          review_status?: string
          seller_type?: string | null
          source_attribution_required?: boolean
          source_images_allowed_for_preview?: boolean
          source_listing_id?: string | null
          source_listing_url?: string | null
          title?: string | null
          transmission_type?: string | null
          trim_name?: string | null
          updated_at?: string
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
          role: string
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
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
          raw_description: string | null
          raw_fuel_text: string | null
          raw_location_text: string | null
          raw_mileage_text: string | null
          raw_payload: Json
          raw_price_text: string | null
          raw_seller_label: string | null
          raw_title: string | null
          raw_transmission_text: string | null
          raw_trim_text: string | null
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
          raw_description?: string | null
          raw_fuel_text?: string | null
          raw_location_text?: string | null
          raw_mileage_text?: string | null
          raw_payload?: Json
          raw_price_text?: string | null
          raw_seller_label?: string | null
          raw_title?: string | null
          raw_transmission_text?: string | null
          raw_trim_text?: string | null
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
          raw_description?: string | null
          raw_fuel_text?: string | null
          raw_location_text?: string | null
          raw_mileage_text?: string | null
          raw_payload?: Json
          raw_price_text?: string | null
          raw_seller_label?: string | null
          raw_title?: string | null
          raw_transmission_text?: string | null
          raw_trim_text?: string | null
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
      [_ in never]: never
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

