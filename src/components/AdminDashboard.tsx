"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import {
  Camera,
  Check,
  Clock,
  Download,
  Edit3,
  FileSpreadsheet,
  ImageOff,
  Loader2,
  LogOut,
  Printer,
  Search,
  Upload,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPermanentAddress, KERALA_DISTRICTS } from "@/lib/constants";
import type { Member, MemberStatus } from "@/types/member";
import PhotoCropperModal from "./PhotoCropperModal";
import { TrustLogo } from "./TrustBrand";

interface AdminDashboardProps {
  initialMembers: Member[];
  adminEmail: string;
}

export default function AdminDashboard({
  initialMembers,
  adminEmail,
}: AdminDashboardProps) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MemberStatus>("all");
  const [residenceFilter, setResidenceFilter] = useState<"all" | "Naatil" | "Abroad">("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<
    "all" | "Maasavari" | "Varshavari"
  >("all");

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Edit modal
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Photo replacement
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoTargetMember, setPhotoTargetMember] = useState<Member | null>(null);
  const [rawCropImage, setRawCropImage] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // CSV Import modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<{
    insertedCount: number;
    skippedCount: number;
    skipped: { row: number; phone: string; reason: string }[];
  } | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = members.length;
    const pending = members.filter((m) => m.status === "pending").length;
    const approved = members.filter((m) => m.status === "approved").length;
    const missingPhotos = members.filter((m) => !m.photo_url).length;
    return { total, pending, approved, missingPhotos };
  }, [members]);

  // Filtered list
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (residenceFilter !== "all" && m.residence_type !== residenceFilter)
        return false;
      if (districtFilter !== "all" && m.district !== districtFilter)
        return false;
      if (
        subscriptionFilter !== "all" &&
        m.subscription_type !== subscriptionFilter
      )
        return false;

      if (q) {
        const matchesName = m.full_name.toLowerCase().includes(q);
        const matchesPhone = m.phone.toLowerCase().includes(q);
        const matchesId = (m.membership_id ?? "").toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesId) return false;
      }
      return true;
    });
  }, [
    members,
    search,
    statusFilter,
    residenceFilter,
    districtFilter,
    subscriptionFilter,
  ]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/members/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to approve");
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? (json.member as Member) : m))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/members/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to reject");
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? (json.member as Member) : m))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/members/${editingMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMember),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setMembers((prev) =>
        prev.map((m) => (m.id === editingMember.id ? (json.member as Member) : m))
      );
      setEditingMember(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSavingEdit(false);
    }
  };

  const triggerPhotoUpload = (member: Member) => {
    setPhotoTargetMember(member);
    photoInputRef.current?.click();
  };

  const handlePhotoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRawCropImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCroppedAdminPhoto = async (blob: Blob) => {
    if (!photoTargetMember) return;
    setUploadingPhoto(true);
    setRawCropImage(null);
    try {
      const supabase = createClient();
      const fileName = `member-${photoTargetMember.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("member-photos")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("member-photos")
        .getPublicUrl(fileName);

      const res = await fetch(`/api/admin/members/${photoTargetMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: urlData.publicUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update photo URL");

      setMembers((prev) =>
        prev.map((m) =>
          m.id === photoTargetMember.id ? (json.member as Member) : m
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingPhoto(false);
      setPhotoTargetMember(null);
    }
  };

  const handleExportCsv = () => {
    const exportRows = members.map((m) => ({
      membership_id: m.membership_id ?? "",
      status: m.status,
      full_name: m.full_name,
      fathers_name: m.fathers_name,
      dob: m.dob,
      blood_group: m.blood_group ?? "",
      marital_status: m.marital_status ?? "",
      phone: m.phone,
      whatsapp: m.whatsapp,
      islamic_qualification: (m.islamic_qualification ?? []).join("; "),
      general_education: m.general_education,
      profession: m.profession,
      residence_type: m.residence_type,
      current_region: m.current_region,
      current_address: m.current_address,
      house_name: m.house_name,
      place_po: m.place_po,
      post_office: m.post_office ?? "",
      district: m.district,
      pincode: m.pincode,
      subscription_type: m.subscription_type,
      subscription_amount: m.subscription_amount,
      validity_date: m.validity_date,
      photo_url: m.photo_url ?? "",
    }));

    const csv = Papa.unparse(exportRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hudaibiyya-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleCsv = () => {
    const sample = [
      {
        membership_id: "HUD-0001",
        full_name: "Muhammed Ali K",
        fathers_name: "Abdurahman K",
        dob: "1985-05-15",
        blood_group: "O+",
        marital_status: "Married",
        phone: "+919876543210",
        whatsapp: "+919876543210",
        islamic_qualification: "Madrasa (6-10); Hafiz",
        general_education: "Bachelor's Degree",
        profession: "Business / Self-Employed",
        residence_type: "Abroad",
        current_region: "UAE - Dubai",
        current_address: "Deira, Dubai, UAE",
        house_name: "Madeena Manzil",
        place_po: "Perunguzhi",
        post_office: "Perunguzhi PO",
        district: "Thiruvananthapuram",
        pincode: "695305",
        subscription_type: "Maasavari",
        subscription_amount: "500",
        validity_date: "2028-12-31",
      },
    ];
    const csv = Papa.unparse(sample);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hudaibiyya-sample-import.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    setCsvResult(null);
    setCsvImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch("/api/admin/members/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: results.data }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Import failed");
          setCsvResult(json);
          // Reload page to get fresh sorted list
          window.location.reload();
        } catch (err) {
          setCsvError(err instanceof Error ? err.message : "CSV import failed");
        } finally {
          setCsvImporting(false);
        }
      },
      error: (err) => {
        setCsvError(err.message);
        setCsvImporting(false);
      },
    });
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePhotoFileSelected}
        className="hidden"
      />

      {rawCropImage && (
        <PhotoCropperModal
          imageSrc={rawCropImage}
          onCancel={() => {
            setRawCropImage(null);
            setPhotoTargetMember(null);
          }}
          onCropComplete={(blob) => handleCroppedAdminPhoto(blob)}
        />
      )}

      {/* Top Bar */}
      <header className="bg-blue-950 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrustLogo className="w-10 h-10 shrink-0" />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Hudaibiyya Admin Portal
              </h1>
              <p className="text-xs text-blue-200">{adminEmail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/print"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>PVC Print Engine</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-700 bg-blue-900 px-3.5 py-2 text-sm font-medium text-blue-100 hover:bg-blue-800 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Members</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pending Approvals</p>
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Approved (Print Ready)</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <ImageOff className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Missing Photos</p>
              <p className="text-2xl font-bold text-rose-700">{stats.missingPhotos}</p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, CSV */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Name, Phone, or HUD-XXXX..."
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCsvResult(null);
                  setCsvError(null);
                  setShowCsvModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3.5 py-2.5 text-sm font-semibold text-blue-800 hover:bg-blue-100 transition"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk CSV Import</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export All CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | MemberStatus)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={residenceFilter}
              onChange={(e) =>
                setResidenceFilter(e.target.value as "all" | "Naatil" | "Abroad")
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">Naatil &amp; Abroad</option>
              <option value="Naatil">Naatil Only</option>
              <option value="Abroad">Abroad Only</option>
            </select>

            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All Districts</option>
              {KERALA_DISTRICTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.value}
                </option>
              ))}
            </select>

            <select
              value={subscriptionFilter}
              onChange={(e) =>
                setSubscriptionFilter(
                  e.target.value as "all" | "Maasavari" | "Varshavari"
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All Subscriptions</option>
              <option value="Maasavari">Maasavari</option>
              <option value="Varshavari">Varshavari</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-4">Photo</th>
                  <th className="py-3.5 px-4">Member ID</th>
                  <th className="py-3.5 px-4">Name &amp; Father</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Subscription</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-slate-500"
                    >
                      No members found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-11 w-11 rounded-full bg-slate-200 overflow-hidden border border-slate-300 flex items-center justify-center shrink-0">
                            {m.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.photo_url}
                                alt={m.full_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={uploadingPhoto}
                            onClick={() => triggerPhotoUpload(m)}
                            title="Upload / Replace Photo"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs font-bold">
                        {m.membership_id ? (
                          <span className="rounded-md bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1">
                            {m.membership_id}
                          </span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{m.full_name}</p>
                        <p className="text-xs text-slate-500">S/o {m.fathers_name}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{m.phone}</p>
                        <p className="text-xs text-slate-500">WA: {m.whatsapp}</p>
                      </td>

                      <td className="py-3 px-4 max-w-[260px]">
                        <p className="font-medium text-slate-800 text-xs leading-relaxed">
                          {formatPermanentAddress(m)}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {m.residence_type} • {m.current_region}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">
                          {m.subscription_type}
                        </p>
                        <p className="text-xs text-slate-500">
                          ₹{m.subscription_amount}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            m.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {m.status !== "approved" && (
                            <button
                              type="button"
                              disabled={actionLoadingId === m.id}
                              onClick={() => handleApprove(m.id)}
                              title="Approve & Assign HUD ID"
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                            >
                              {actionLoadingId === m.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve</span>
                            </button>
                          )}

                          {m.status !== "rejected" && (
                            <button
                              type="button"
                              disabled={actionLoadingId === m.id}
                              onClick={() => handleReject(m.id)}
                              title="Reject"
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingMember({ ...m })}
                            title="Edit Details"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between bg-blue-950 text-white px-5 py-4 sticky top-0">
              <h3 className="font-bold">
                Edit Member {editingMember.membership_id ?? "(Pending)"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg hover:bg-blue-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.full_name}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, full_name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.fathers_name}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        fathers_name: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.phone}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, phone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.whatsapp}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, whatsapp: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={editingMember.dob}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, dob: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Validity Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editingMember.validity_date}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        validity_date: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Home Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.house_name}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, house_name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Correct Place
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.place_po}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, place_po: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Post Office
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.post_office ?? ""}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, post_office: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    District
                  </label>
                  <select
                    value={editingMember.district}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, district: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {KERALA_DISTRICTS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    PIN
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.pincode}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, pincode: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Current Region
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.current_region}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        current_region: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subscription Type
                  </label>
                  <select
                    value={editingMember.subscription_type}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        subscription_type: e.target.value as "Maasavari" | "Varshavari",
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="Maasavari">Maasavari</option>
                    <option value="Varshavari">Varshavari</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subscription Amount
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMember.subscription_amount}
                    onChange={(e) =>
                      setEditingMember({
                        ...editingMember,
                        subscription_amount: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {savingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between bg-blue-950 text-white px-5 py-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-bold">Bulk Import Legacy Members (CSV)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="p-1 rounded-lg hover:bg-blue-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload a <code>.csv</code> file to bulk-import existing members directly as{" "}
                <strong>approved</strong>. Duplicate phone numbers are automatically
                validated and skipped, and missing Membership IDs are auto-assigned
                sequentially (<code>HUD-XXXX</code>).
              </p>

              <button
                type="button"
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample CSV Template</span>
              </button>

              {csvError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
                  {csvError}
                </div>
              )}

              {csvResult && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
                  <p className="font-semibold">
                    Imported {csvResult.insertedCount} members (Skipped{" "}
                    {csvResult.skippedCount})
                  </p>
                  {csvResult.skipped.slice(0, 5).map((s, i) => (
                    <p key={i} className="text-amber-800">
                      Row {s.row} ({s.phone}): {s.reason}
                    </p>
                  ))}
                </div>
              )}

              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-6 cursor-pointer hover:bg-blue-50 transition">
                {csvImporting ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-blue-700 mb-2" />
                    <span className="text-sm font-semibold text-blue-900">
                      Importing CSV records...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-blue-700 mb-2" />
                    <span className="text-sm font-semibold text-blue-900">
                      Click to select .csv file
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Supports ~400+ records per upload
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={csvImporting}
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
