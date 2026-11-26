import React, { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldAlert,
  User,
} from "lucide-react";
import { TrustLogo } from "@/components/TrustBrand";
import { formatPermanentAddress } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";
import type { PublicVerificationMember } from "@/types/member";

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

async function VerificationContent({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  await connection();
  const { memberId } = await params;
  const decodedId = decodeURIComponent(memberId).trim().toUpperCase();

  let member: PublicVerificationMember | null = null;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("members")
      .select(
        "membership_id, full_name, photo_url, house_name, place_po, post_office, district, pincode, current_region, status, validity_date"
      )
      .eq("membership_id", decodedId)
      .maybeSingle();

    if (data) {
      member = data as PublicVerificationMember;
    }
  } catch {
    member = null;
  }

  const isExpired = member
    ? new Date(member.validity_date) < new Date(new Date().toDateString())
    : false;
  const isActive =
    member !== null && member.status === "approved" && !isExpired;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-950 to-blue-800 text-white py-5 px-4 shadow-md">
        <div className="mx-auto max-w-md flex items-center gap-3.5">
          <TrustLogo className="w-12 h-12 shrink-0" />
          <div>
            <p className="text-xs text-blue-200 font-medium">
              ഹുദൈബിയ്യ ഇസ്ലാമിക് ട്രസ്റ്റ്
            </p>
            <h1 className="text-lg font-bold leading-tight">
              Hudaibiyya Islamic Trust
            </h1>
            <p className="text-[11px] text-blue-100/90">
              Official Member Verification Portal
            </p>
          </div>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          {/* Status Banner */}
          <div
            className={`px-6 py-4 flex items-center justify-center gap-2.5 text-white font-bold text-sm tracking-wide ${
              isActive ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {isActive ? (
              <>
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>VERIFIED ACTIVE MEMBER</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>INACTIVE / INVALID MEMBER</span>
              </>
            )}
          </div>

          {member ? (
            <div className="p-6 sm:p-8 flex flex-col items-center text-center space-y-5">
              {/* Member Photo */}
              <div className="h-32 w-32 rounded-full border-4 border-blue-100 bg-slate-100 shadow-md overflow-hidden flex items-center justify-center">
                {member.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo_url}
                    alt={member.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14 text-slate-400" />
                )}
              </div>

              <div className="space-y-1.5">
                <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-mono font-bold text-blue-900">
                  {member.membership_id}
                </span>
                <h2 className="text-2xl font-bold text-slate-900">
                  {member.full_name}
                </h2>
              </div>

              {/* Safe Public Details Only */}
              <div className="w-full rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 shrink-0">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    Permanent Address
                  </span>
                  <span className="text-sm font-semibold text-slate-900 text-right leading-snug">
                    {formatPermanentAddress(member)}
                  </span>
                </div>

                <div className="border-t border-slate-200/70 pt-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    Current Region
                  </span>
                  <span className="text-sm font-semibold text-slate-900 text-right">
                    {member.current_region}
                  </span>
                </div>

                <div className="border-t border-slate-200/70 pt-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar className="w-4 h-4 text-blue-700" />
                    Validity Date
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      isExpired ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {formatDisplayDate(member.validity_date)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                {isActive
                  ? "ഈ അംഗത്വം നിലവിൽ സാധുവാണ്. • This membership is currently active and verified."
                  : "ഈ അംഗത്വം നിലവിൽ സജീവമല്ല. • This membership is inactive, pending, or expired."}
              </p>
            </div>
          ) : (
            <div className="p-8 text-center space-y-4">
              <p className="text-base font-semibold text-slate-800">
                Record Not Found
              </p>
              <p className="text-sm text-slate-600">
                No member found with ID{" "}
                <span className="font-mono font-bold text-slate-900">
                  {decodedId}
                </span>
                . Please verify the QR code or contact the Hudaibiyya Islamic
                Trust office.
              </p>
            </div>
          )}

          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Hudaibiyya Islamic Trust Registration Portal →
            </Link>
          </div>
        </div>
      </main>
    </div>
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
