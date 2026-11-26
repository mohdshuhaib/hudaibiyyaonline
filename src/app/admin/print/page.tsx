import React, { Suspense } from "react";
import { connection } from "next/server";
import { Loader2 } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import PrintEngine from "@/components/PrintEngine";
import { createAdminClient, requireAdmin } from "@/lib/supabase/server";
import type { Member } from "@/types/member";

async function PrintGate() {
  await connection();
  const user = await requireAdmin();

  if (!user) {
    return <AdminLogin />;
  }

  const adminClient = createAdminClient();
  const { data: approvedMembers, error } = await adminClient
    .from("members")
    .select("*")
    .eq("status", "approved")
    .order("membership_id", { ascending: true });

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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://hudaibiyyaonline.vercel.app";

  return (
    <PrintEngine
      approvedMembers={(approvedMembers ?? []) as Member[]}
      siteUrl={siteUrl}
    />
  );
}

export default function AdminPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        </div>
      }
    >
      <PrintGate />
    </Suspense>
  );
}
