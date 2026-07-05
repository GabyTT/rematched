import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

type PublicSchema = Database["public"];
type SupabaseQueryClient = {
  from: <TableName extends keyof PublicSchema["Tables"]>(
    table: TableName,
  ) => {
    select: (columns?: string) => unknown;
    insert: (values: PublicSchema["Tables"][TableName]["Insert"]) => unknown;
    update: (values: PublicSchema["Tables"][TableName]["Update"]) => {
      eq: (column: string, value: string | number | boolean) => unknown;
    };
  };
};

export type ProfileRow = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type PreferenceProfileRow = Tables<"preference_profiles">;
export type PreferenceProfileInsert = TablesInsert<"preference_profiles">;
export type PreferenceProfileUpdate = TablesUpdate<"preference_profiles">;

export type PreferenceProfileBrandRow = Tables<"preference_profile_brands">;
export type PreferenceProfileBrandInsert = TablesInsert<"preference_profile_brands">;
export type PreferenceProfileBrandUpdate = TablesUpdate<"preference_profile_brands">;

export type Phase1PreferenceProfileWithBrands = PreferenceProfileRow & {
  preference_profile_brands: Pick<
    PreferenceProfileBrandRow,
    "id" | "brand_name" | "brand_name_normalized"
  >[];
};

export const phase1ProfileColumns =
  "id, auth_user_id, display_name, phone, whatsapp_enabled, role, created_at, updated_at";

export const phase1PreferenceProfileColumns = `
  id,
  profile_id,
  is_active,
  budget_min,
  budget_max,
  vehicle_type,
  model_query,
  preference_profile_brands (
    id,
    brand_name,
    brand_name_normalized
  )
`;

export function buildCurrentUserProfileQuery(supabase: SupabaseQueryClient) {
  return supabase.from("profiles").select(phase1ProfileColumns);
}

export function buildActivePreferenceProfileQuery(supabase: SupabaseQueryClient) {
  return supabase
    .from("preference_profiles")
    .select(phase1PreferenceProfileColumns);
}

export function buildProfileUpdate(
  displayName: string,
  phone: string | null,
): ProfileUpdate {
  return {
    display_name: displayName,
    phone,
  };
}

export function buildPreferenceProfileInsert(
  profileId: string,
): PreferenceProfileInsert {
  return {
    profile_id: profileId,
    is_active: true,
    budget_min: 85000,
    budget_max: 145000,
    vehicle_type: "suv",
    model_query: "RAV4",
  };
}

export function buildPreferenceBrandInsert(
  preferenceProfileId: string,
  brandName: string,
): PreferenceProfileBrandInsert {
  return {
    preference_profile_id: preferenceProfileId,
    brand_name: brandName,
  };
}
