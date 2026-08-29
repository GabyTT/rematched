import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

type TypedSupabaseClient = SupabaseClient<Database>;

export type Profile = Tables<"profiles">;
export type ProfileInput = Pick<
  TablesInsert<"profiles">,
  "display_name" | "phone" | "whatsapp_enabled"
>;

export type ActivePreferenceProfile = Tables<"preference_profiles"> & {
  preference_profile_brands: Pick<
    Tables<"preference_profile_brands">,
    "id" | "brand_name" | "brand_name_normalized"
  >[];
};

export type PreferenceProfileInput = Pick<
  TablesInsert<"preference_profiles">,
  "budget_min" | "budget_max" | "vehicle_type" | "model_query"
>;

const activePreferenceProfileSelect = `
  id,
  profile_id,
  is_active,
  budget_min,
  budget_max,
  vehicle_type,
  model_query,
  created_at,
  updated_at,
  preference_profile_brands (
    id,
    brand_name,
    brand_name_normalized
  )
`;

async function getCurrentUserId(supabase: TypedSupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (error.name === "AuthSessionMissingError") {
      return null;
    }

    throw error;
  }

  return user?.id ?? null;
}

async function requireCurrentUserId(supabase: TypedSupabaseClient) {
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    throw new Error("A signed-in Supabase user is required.");
  }

  return userId;
}

async function getOrCreateCurrentUserProfile(supabase: TypedSupabaseClient) {
  const userId = await requireCurrentUserId(supabase);

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: userId,
      },
      {
        onConflict: "auth_user_id",
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function readCurrentUserProfile(supabase: TypedSupabaseClient) {
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveCurrentUserProfile(
  supabase: TypedSupabaseClient,
  profile: ProfileInput,
) {
  const userId = await requireCurrentUserId(supabase);

  return saveProfileForAuthUser(supabase, userId, profile);
}

export async function saveProfileForAuthUser(
  supabase: TypedSupabaseClient,
  authUserId: string,
  profile: ProfileInput,
) {
  const currentUserId = await requireCurrentUserId(supabase);

  if (currentUserId !== authUserId) {
    throw new Error("Signed-in Supabase user does not match the profile user.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: authUserId,
        ...profile,
      },
      {
        onConflict: "auth_user_id",
      },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function readActivePreferenceProfile(
  supabase: TypedSupabaseClient,
) {
  const profile = await readCurrentUserProfile(supabase);

  if (!profile) {
    return null;
  }

  const { data, error } = await supabase
    .from("preference_profiles")
    .select(activePreferenceProfileSelect)
    .eq("profile_id", profile.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ActivePreferenceProfile | null;
}

export async function saveActivePreferenceProfile(
  supabase: TypedSupabaseClient,
  preferenceProfile: PreferenceProfileInput,
) {
  const profile = await getOrCreateCurrentUserProfile(supabase);
  const existingPreferenceProfile = await readActivePreferenceProfile(supabase);

  if (existingPreferenceProfile) {
    const updatePayload: TablesUpdate<"preference_profiles"> = {
      ...preferenceProfile,
    };

    const { data, error } = await supabase
      .from("preference_profiles")
      .update(updatePayload)
      .eq("id", existingPreferenceProfile.id)
      .select(activePreferenceProfileSelect)
      .single();

    if (error) {
      throw error;
    }

    return data as ActivePreferenceProfile;
  }

  const insertPayload: TablesInsert<"preference_profiles"> = {
    profile_id: profile.id,
    is_active: true,
    ...preferenceProfile,
  };

  const { data, error } = await supabase
    .from("preference_profiles")
    .insert(insertPayload)
    .select(activePreferenceProfileSelect)
    .single();

  if (error) {
    throw error;
  }

  return data as ActivePreferenceProfile;
}

export async function replaceSelectedPreferenceBrands(
  supabase: TypedSupabaseClient,
  preferenceProfileId: string,
  brandNames: string[],
) {
  const { error: deleteError } = await supabase
    .from("preference_profile_brands")
    .delete()
    .eq("preference_profile_id", preferenceProfileId);

  if (deleteError) {
    throw deleteError;
  }

  const uniqueBrandNames = Array.from(
    new Set(
      brandNames
        .map((brandName) => brandName.trim())
        .filter((brandName) => brandName.length > 0),
    ),
  );

  if (uniqueBrandNames.length === 0) {
    return [];
  }

  const insertPayload: TablesInsert<"preference_profile_brands">[] =
    uniqueBrandNames.map((brandName) => ({
      preference_profile_id: preferenceProfileId,
      brand_name: brandName,
    }));

  const { data, error } = await supabase
    .from("preference_profile_brands")
    .insert(insertPayload)
    .select("id, preference_profile_id, brand_name, brand_name_normalized");

  if (error) {
    throw error;
  }

  return data;
}
