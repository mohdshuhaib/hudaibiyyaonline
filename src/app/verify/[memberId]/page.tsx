import React, { Suspense } from "react";
import { connection } from "next/server";
import {
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  CreditCard,
  Droplets,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import { TrustLogo } from "@/components/TrustBrand";
import { formatPermanentAddress } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";
import type { Member } from "@/types/member";

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

function calculateAge(dateStr: string): number | null {
  try {
    const dob = new Date(dateStr);
    if (Number.isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

function DetailRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 shrink-0 pt-0.5">
        {icon}
        <span>{label}</span>
      </span>
      {href ? (
        <a
          href={href}
          className="text-sm font-semibold text-blue-700 hover:underline text-right break-all"
        >
          {value}
        </a>
      ) : (
        <span className="text-sm font-semibold text-slate-900 text-right leading-snug break-words max-w-[62%]">
          {value}
        </span>
      )}
    </div>
  );
}

async function VerificationContent({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  await connection();
  const { memberId } = await params;
  const decodedId = decodeURIComponent(memberId).trim().toUpperCase();

  let member: Member | null = null;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("membership_id", decodedId)
      .maybeSingle();

    if (data) {
      member = data as Member;
    }
  } catch {
    member = null;
  }

  const isExpired = member
    ? new Date(member.validity_date) < new Date(new Date().toDateString())
    : false;
  const isActive =
    member !== null && member.status === "approved" && !isExpired;
  const age = member ? calculateAge(member.dob) : null;
  const dobDisplay = member
    ? `${formatDisplayDate(member.dob)}${age !== null ? ` (${age} yrs)` : ""}`
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Institutional Header */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white py-4 px-4 shadow-md">
        <div className="mx-auto max-w-lg flex items-center gap-3.5">
          <TrustLogo className="w-11 h-11 shrink-0" />
          <div>
            <p className="text-xs text-blue-200 font-medium">
              ഹുദൈബിയ്യ ഇസ്ലാമിക് ചാരിറ്റബിൾ ട്രസ്റ്റ്
            </p>
            <h1 className="text-base sm:text-lg font-bold leading-tight">
              Hudaibiyya Islamic Charitable Trust
            </h1>
            <p className="text-[11px] text-blue-100/90">
              Official Member Profile &amp; Verification
            </p>
          </div>
        </div>
      </header>

      {/* Main Profile Card */}
      <main className="flex-1 mx-auto w-full max-w-lg px-3.5 py-5 sm:py-7">
        <div className="rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          {/* Status Banner */}
          <div
            className={`px-4 py-3.5 flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm tracking-wide ${
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
            <div className="p-4 sm:p-6 space-y-5">
              {/* Hero Profile */}
              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-blue-100 bg-slate-100 shadow-md overflow-hidden flex items-center justify-center">
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

                <div className="space-y-1">
                  <span className="inline-block rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-mono font-bold text-blue-900">
                    {member.membership_id}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {member.full_name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    S/o {member.fathers_name}
                  </p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 pt-1.5 pb-1">
                  Personal Details
                </p>
                <DetailRow
                  icon={<Calendar className="w-4 h-4 text-blue-700" />}
                  label="Date of Birth"
                  value={dobDisplay}
                />
                {member.blood_group && (
                  <DetailRow
                    icon={<Droplets className="w-4 h-4 text-rose-600" />}
                    label="Blood Group"
                    value={member.blood_group}
                  />
                )}
                {member.marital_status && (
                  <DetailRow
                    icon={<Heart className="w-4 h-4 text-blue-700" />}
                    label="Marital Status"
                    value={member.marital_status}
                  />
                )}
                {member.marital_status === "Married" && member.wife_name && (
                  <DetailRow
                    icon={<User className="w-4 h-4 text-blue-700" />}
                    label="Wife's Name"
                    value={member.wife_name}
                  />
                )}
                {member.marital_status === "Married" &&
                  member.children_details &&
                  member.children_details.length > 0 && (
                    <div className="py-2.5 border-t border-slate-100 space-y-2">
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                        <Users className="w-4 h-4 text-blue-700" />
                        <span>Children ({member.children_details.length})</span>
                      </span>
                      <div className="space-y-1.5 pl-6">
                        {member.children_details.map((child, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 text-xs bg-white rounded-lg px-2.5 py-1.5 border border-slate-200"
                          >
                            <span className="font-semibold text-slate-900">
                              {child.name || `Child ${idx + 1}`}{" "}
                              <span className="text-slate-500 font-normal">
                                ({child.relation})
                              </span>
                            </span>
                            {child.dob && (
                              <span className="text-slate-600 font-medium">
                                {formatDisplayDate(child.dob)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Contact Details */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 pt-1.5 pb-1">
                  Contact Details
                </p>
                <DetailRow
                  icon={<Phone className="w-4 h-4 text-blue-700" />}
                  label="Mobile"
                  value={member.phone}
                  href={`tel:${member.phone.replace(/\s+/g, "")}`}
                />
                <DetailRow
                  icon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
                  label="WhatsApp"
                  value={member.whatsapp}
                  href={`https://wa.me/${member.whatsapp.replace(/[^\d]/g, "")}`}
                />
                {member.email && (
                  <DetailRow
                    icon={<Mail className="w-4 h-4 text-blue-700" />}
                    label="Email"
                    value={member.email}
                    href={`mailto:${member.email}`}
                  />
                )}
              </div>

              {/* Education & Profession */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 pt-1.5 pb-1">
                  Education &amp; Profession
                </p>
                {member.islamic_qualification &&
                  member.islamic_qualification.length > 0 && (
                    <div className="py-2.5 border-b border-slate-100 space-y-2">
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                        <BookOpen className="w-4 h-4 text-blue-700" />
                        <span>Islamic Qualification</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {member.islamic_qualification.map((qual) => (
                          <span
                            key={qual}
                            className="inline-block rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-900"
                          >
                            {qual}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                <DetailRow
                  icon={<GraduationCap className="w-4 h-4 text-blue-700" />}
                  label="General Ed."
                  value={member.general_education}
                />
                <DetailRow
                  icon={<Briefcase className="w-4 h-4 text-blue-700" />}
                  label="Profession"
                  value={member.profession}
                />
              </div>

              {/* Address & Residence */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 pt-1.5 pb-1">
                  Address &amp; Residence
                </p>

                <div className="py-2.5 border-b border-slate-100 space-y-1">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Home className="w-4 h-4 text-blue-700" />
                    <span>Permanent Address</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed pl-6">
                    {formatPermanentAddress(member)}
                  </p>
                  {member.house_status && (
                    <p className="text-xs font-medium text-slate-600 pl-6">
                      House Status: {member.house_status}
                    </p>
                  )}
                </div>

                <DetailRow
                  icon={<Globe className="w-4 h-4 text-blue-700" />}
                  label="Residing"
                  value={`${
                    member.residence_type === "Naatil" ? "In India" : "Abroad"
                  } • ${member.current_region}`}
                />

                <div className="py-2.5 space-y-1">
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    <span>Current Address</span>
                  </span>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed pl-6">
                    {member.current_address}
                  </p>
                </div>
              </div>

              {/* Connection with Shaikhuna */}
              {member.shaikhuna_connection && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 pt-1.5 pb-1">
                    Connection with Shaikhuna
                  </p>
                  <DetailRow
                    icon={<Users className="w-4 h-4 text-blue-700" />}
                    label="Connection"
                    value={member.shaikhuna_connection}
                  />
                  {member.shaikhuna_lineage && (
                    <div className="py-2.5 space-y-1">
                      <span className="text-xs font-medium text-slate-500">
                        Shishya Parambara Details
                      </span>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {member.shaikhuna_lineage}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Membership & Subscription */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800 pt-1.5 pb-1">
                  Membership &amp; Subscription
                </p>
                <DetailRow
                  icon={<CreditCard className="w-4 h-4 text-blue-700" />}
                  label="Subscription"
                  value={`${member.subscription_type} (₹${member.subscription_amount})`}
                />
                <DetailRow
                  icon={<Calendar className="w-4 h-4 text-blue-700" />}
                  label="Valid Until"
                  value={formatDisplayDate(member.validity_date)}
                />
              </div>

              <p className="text-center text-xs text-slate-500 pt-1">
                {isActive
                  ? "ഈ അംഗത്വം നിലവിൽ സാധുവാണ്. • This membership is active and verified."
                  : "ഈ അംഗത്വം നിലവിൽ സജീവമല്ല. • This membership is inactive, pending, or expired."}
              </p>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <p className="text-base font-semibold text-slate-800">
                Record Not Found
              </p>
              <p className="text-sm text-slate-600">
                No member found with ID{" "}
                <span className="font-mono font-bold text-slate-900">
                  {decodedId}
                </span>
                . Please verify the QR code or contact the Hudaibiyya Islamic
                Charitable Trust office.
              </p>
            </div>
          )}

          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 text-center">
            <p className="text-[11px] font-medium text-slate-500">
              Hudaibiyya Islamic Charitable Trust • ഹുദൈബിയ്യ ഇസ്ലാമിക് ചാരിറ്റബിൾ ട്രസ്റ്റ്
            </p>
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
