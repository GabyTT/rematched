"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, UserPlus, Users } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AdminBadge, AdminSection } from "@/components/admin/AdminUI";

type ManagedUser = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  roles: string[];
};

const roleOptions = ["seller", "advertiser", "admin"] as const;

export function AdminUsersExperience() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const adminFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Your admin session has expired. Please sign in again.");

    return fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  }, [supabase]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await adminFetch("/api/admin/users");
      const payload = (await response.json()) as { users?: ManagedUser[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load users.");
      setUsers(payload.users ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const saveRoles = async (user: ManagedUser, roles: string[]) => {
    setIsSaving(user.id);
    setErrorMessage(null);
    try {
      const response = await adminFetch(`/api/admin/users/${user.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
      const payload = (await response.json()) as { roles?: string[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to update roles.");
      setUsers((current) => current.map((candidate) => candidate.id === user.id ? { ...candidate, roles: payload.roles ?? [] } : candidate));
      setNotice(`Updated roles for ${user.email ?? "this account"}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update roles.");
    } finally {
      setIsSaving(null);
    }
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving("new-user");
    setErrorMessage(null);
    setNotice(null);
    try {
      const response = await adminFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to create user.");
      setEmail("");
      setPassword("");
      setNotice("Account created as a standard buyer. Assign elevated roles below if needed.");
      await loadUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create user.");
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="grid gap-6">
      <AdminSection title="Create a test user" description="New accounts start with buyer access. Add seller, advertiser, or admin access after creating the account." icon={UserPlus}>
        <form onSubmit={createUser} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-300">Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="off" className="app-input min-h-11 rounded-[16px] border border-input bg-background px-4 text-white" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-300">Temporary password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete="new-password" className="app-input min-h-11 rounded-[16px] border border-input bg-background px-4 text-white" />
          </label>
          <button type="submit" disabled={isSaving === "new-user"} className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 text-sm font-semibold text-white disabled:opacity-60">
            {isSaving === "new-user" ? "Creating..." : "Create user"}
          </button>
        </form>
      </AdminSection>

      <AdminSection title="Users and roles" description="Buyer access is automatic. Tick elevated roles to test capability combinations." icon={Users}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">{users.length} account{users.length === 1 ? "" : "s"}</p>
          <button type="button" onClick={() => void loadUsers()} disabled={isLoading} className="inline-flex min-h-10 items-center rounded-full border border-input px-4 text-sm font-semibold text-slate-200 disabled:opacity-60">
            <RefreshCw size={15} className="mr-2" /> Refresh
          </button>
        </div>
        {errorMessage ? <p className="mt-4 rounded-[18px] border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{errorMessage}</p> : null}
        {notice ? <p className="mt-4 rounded-[18px] border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</p> : null}
        {isLoading ? <p className="mt-5 text-slate-300">Loading users...</p> : (
          <div className="mt-5 grid gap-3">
            {users.map((user) => (
              <article key={user.id} className="rounded-[22px] border border-input bg-white/[0.03] p-4">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                  <div>
                    <p className="font-semibold text-white">{user.email ?? "Email unavailable"}</p>
                    <p className="mt-1 text-sm text-slate-400">Created {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {roleOptions.map((role) => {
                      const checked = user.roles.includes(role);
                      return (
                        <label key={role} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-input px-3 text-sm font-semibold text-slate-200">
                          <input type="checkbox" checked={checked} disabled={isSaving === user.id} onChange={() => void saveRoles(user, checked ? user.roles.filter((current) => current !== role) : [...user.roles, role])} className="accent-[#D1133A]" />
                          {role}
                        </label>
                      );
                    })}
                    {user.roles.length === 0 ? <AdminBadge tone="neutral" label="Buyer" /> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
