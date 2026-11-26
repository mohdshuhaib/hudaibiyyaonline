import React, { Suspense } from "react";
import { connection } from "next/server";
import { Loader2 } from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import AdminLogin from "@/components/AdminLogin";
import { createAdminClient, requireAdmin } from "@/lib/supabase/server";
import type { Member } from "@/types/member";

async function AdminGate() {
  await connection();
  const user = await requireAdmin();

  if (!user) {
    return <AdminLogin />;
  }

  const adminClient = createAdminClient();
  const { data: members, error } = await adminClient
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="rounded-2xl bg-white p-6 border border-red-200 text-red-800 max-w-md text-center">
          <p className="font-bold">Database Error</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboard
      initialMembers={(members ?? []) as Member[]}
      adminEmail={user.email ?? ""}
    />
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        </div>
      }
    >
      <AdminGate />
    </Suspense>
  );
}
