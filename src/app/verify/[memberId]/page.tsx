import React, { Suspense } from "react";
import { connection } from "next/server";
import { Loader2 } from "lucide-react";
import VerifyMemberClient from "@/components/VerifyMemberClient";
import { createAdminClient } from "@/lib/supabase/server";

async function VerificationContent({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  await connection();
  const { memberId } = await params;
  const decodedId = decodeURIComponent(memberId).trim().toUpperCase();

  let recordExists = false;
  let isActive = false;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("members")
      .select("status, validity_date")
      .eq("membership_id", decodedId)
      .maybeSingle();

    if (data) {
      recordExists = true;
      const isExpired =
        new Date(data.validity_date) < new Date(new Date().toDateString());
      isActive = data.status === "approved" && !isExpired;
    }
  } catch {
    recordExists = false;
  }

  return (
    <VerifyMemberClient
      memberId={decodedId}
      recordExists={recordExists}
      isActive={isActive}
    />
  );
}

export default function VerifyMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        </div>
      }
    >
      <VerificationContent params={params} />
    </Suspense>
  );
}
