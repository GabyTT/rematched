import { NextResponse } from "next/server";

import { createAdminServiceClient, requireAdminUser } from "@/lib/adminUserAccess";

const allowedRoles = new Set(["seller", "advertiser", "admin"]);

export async function PUT(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireAdminUser(request);
    const { userId } = await context.params;
    const body = (await request.json()) as { roles?: unknown };
    const roles = Array.isArray(body.roles)
      ? body.roles.filter((role): role is string => typeof role === "string" && allowedRoles.has(role))
      : [];
    const uniqueRoles = [...new Set(roles)];

    if (userId === admin.id && !uniqueRoles.includes("admin")) {
      return NextResponse.json({ error: "You cannot remove your own admin role." }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (deleteError) throw deleteError;
    if (uniqueRoles.length > 0) {
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(uniqueRoles.map((role) => ({ user_id: userId, role })));
      if (insertError) throw insertError;
    }

    return NextResponse.json({ roles: uniqueRoles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update roles." },
      { status: 403 },
    );
  }
}
