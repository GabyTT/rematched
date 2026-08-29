import { NextResponse } from "next/server";

import { createAdminServiceClient, requireAdminUser } from "@/lib/adminUserAccess";

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const supabase = createAdminServiceClient();
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw usersError;

    const { data: assignments, error: assignmentsError } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (assignmentsError) throw assignmentsError;

    const rolesByUserId = new Map<string, string[]>();
    for (const assignment of assignments ?? []) {
      const current = rolesByUserId.get(assignment.user_id) ?? [];
      current.push(assignment.role);
      rolesByUserId.set(assignment.user_id, current);
    }

    return NextResponse.json({
      users: users.users.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        roles: rolesByUserId.get(user.id) ?? [],
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load users." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Provide an email and a password of at least 6 characters." }, { status: 400 });
    }

    const supabase = createAdminServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email, roles: [] },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create user." },
      { status: 403 },
    );
  }
}
