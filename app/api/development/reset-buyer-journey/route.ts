import { NextResponse } from "next/server";

import { createAdminServiceClient } from "@/lib/adminUserAccess";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getBearerToken(request: Request) {
  const value = request.headers.get("authorization");
  return value?.startsWith("Bearer ") ? value.slice("Bearer ".length) : null;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const token = getBearerToken(request);
    if (!token) {
      throw new Error("A signed-in test account is required.");
    }

    const authClient = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error("A signed-in test account is required.");
    }

    const supabase = createAdminServiceClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    if (profile) {
      const { error: preferencesError } = await supabase
        .from("preference_profiles")
        .delete()
        .eq("profile_id", profile.id);
      if (preferencesError) throw preferencesError;
    }

    return NextResponse.json({ reset: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reset this buyer journey.",
      },
      { status: 403 },
    );
  }
}
