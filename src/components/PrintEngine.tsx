"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  CheckSquare,
  Download,
  FileText,
  Loader2,
  Printer,
  Search,
  Square,
} from "lucide-react";
import { renderCardBackPng, renderCardFrontPng } from "@/lib/card-canvas";
import type { Member } from "@/types/member";
import { PvcIdCardBack, PvcIdCardFront } from "./PvcIdCard";
import { TrustLogo } from "./TrustBrand";

interface PrintEngineProps {
  approvedMembers: Member[];
  siteUrl: string;
}

export default function PrintEngine({
  approvedMembers,
  siteUrl,
}: PrintEngineProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    approvedMembers.slice(0, 4).map((m) => m.id)
  );
  const [search, setSearch] = useState("");
  const [previewSide, setPreviewSide] = useState<"both" | "front" | "back">("both");
  const [exporting, setExporting] = useState<"cr80" | "a4" | null>(null);
  const [progress, setProgress] = useState<string>("");

  const frontRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const backRef = useRef<HTMLDivElement | null>(null);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return approvedMembers;
    return approvedMembers.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        (m.membership_id ?? "").toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q)
    );
  }, [approvedMembers, search]);

  const selectedMembers = useMemo(
    () => approvedMembers.filter((m) => selectedIds.includes(m.id)),
    [approvedMembers, selectedIds]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllApproved = () => {
    setSelectedIds(approvedMembers.map((m) => m.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const captureFrontPng = async (member: Member): Promise<string> => {
    const container = frontRefs.current[member.id];
    const qrCanvas = container?.querySelector("canvas") ?? null;
    return renderCardFrontPng(member, qrCanvas);
  };

  // ATM / CR80 Landscape: 85.6mm x 54mm (Front + Back per member)
  const exportCr80Pdf = async () => {
    if (selectedMembers.length === 0) return;
    setExporting("cr80");
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 54],
      });

      setProgress("Rendering card back template...");
      const backImg = await renderCardBackPng();

      for (let i = 0; i < selectedMembers.length; i++) {
        const m = selectedMembers[i];
        setProgress(`Rendering card ${i + 1} of ${selectedMembers.length}...`);
        const frontImg = await captureFrontPng(m);

        if (i > 0) pdf.addPage([85.6, 54], "landscape");
        pdf.addImage(frontImg, "PNG", 0, 0, 85.6, 54);

        pdf.addPage([85.6, 54], "landscape");
        pdf.addImage(backImg, "PNG", 0, 0, 85.6, 54);
      }

      pdf.save(`hudaibiyya-atm-cards-${selectedMembers.length}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export CR80 PDF");
    } finally {
      setExporting(null);
      setProgress("");
    }
  };

  // A4 Sheet Multi-Card PDF: 2 cols x 4 rows = 8 landscape cards (85.6mm x 54mm) per page
  const exportA4Pdf = async () => {
    if (selectedMembers.length === 0) return;
    setExporting("a4");
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const cardW = 85.6;
      const cardH = 54;
      const gapX = 10;
      const gapY = 10;
      const marginLeft = (210 - (cardW * 2 + gapX)) / 2;
      const marginTop = (297 - (cardH * 4 + gapY * 3)) / 2;

      // Front pages
      for (let i = 0; i < selectedMembers.length; i++) {
        const m = selectedMembers[i];
        setProgress(`Rendering fronts (${i + 1}/${selectedMembers.length})...`);
        const frontImg = await captureFrontPng(m);

        const indexOnPage = i % 8;
        if (i > 0 && indexOnPage === 0) {
          pdf.addPage("a4", "portrait");
        }

        const col = indexOnPage % 2;
        const row = Math.floor(indexOnPage / 2);
        const x = marginLeft + col * (cardW + gapX);
        const y = marginTop + row * (cardH + gapY);

        pdf.addImage(frontImg, "PNG", x, y, cardW, cardH);
      }

      // Back sheet page (8 backs for duplex alignment)
      setProgress("Rendering back sheet...");
      const backImg = await renderCardBackPng();
      pdf.addPage("a4", "portrait");
      for (let j = 0; j < Math.min(selectedMembers.length, 8); j++) {
        const col = j % 2;
        const row = Math.floor(j / 2);
        const x = marginLeft + col * (cardW + gapX);
        const y = marginTop + row * (cardH + gapY);
        pdf.addImage(backImg, "PNG", x, y, cardW, cardH);
      }

      pdf.save(`hudaibiyya-a4-sheet-${selectedMembers.length}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export A4 PDF");
    } finally {
      setExporting(null);
      setProgress("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Offscreen / Mounted Back Card Ref for PDF Capture */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <div ref={backRef}>
          <PvcIdCardBack />
        </div>
      </div>

      {/* Header */}
      <header className="bg-blue-950 text-white shadow-md no-print">
        <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrustLogo className="w-10 h-10 shrink-0" />
            <div>
              <h1 className="text-lg font-bold">PVC ID Card Batch Print Engine</h1>
              <p className="text-xs text-blue-200">
                ATM / CR80 Landscape (85.6mm × 54mm) • Front &amp; Back CMYK-Safe Print PDF
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-700 bg-blue-900 px-3.5 py-2 text-sm font-medium text-blue-100 hover:bg-blue-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Member Selector */}
        <aside className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-4 h-fit lg:sticky lg:top-6 no-print">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              Approved Members ({approvedMembers.length})
            </h2>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              {selectedIds.length} Selected
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter approved members..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllApproved}
              className="flex-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition"
            >
              Select All Approved
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Clear
            </button>
          </div>

          {/* Preview Side Toggle */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
            {(["both", "front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setPreviewSide(side)}
                className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition ${
                  previewSide === side
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {side}
              </button>
            ))}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {filteredMembers.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 text-center">
                No approved members found.
              </p>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = selectedIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSelect(m.id)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition ${
                      isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {m.full_name}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {m.membership_id} • {m.district}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Export Buttons */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {progress && (
              <p className="text-xs font-medium text-blue-700 text-center">
                {progress}
              </p>
            )}

            <button
              type="button"
              disabled={selectedMembers.length === 0 || exporting !== null}
              onClick={exportCr80Pdf}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition"
            >
              {exporting === "cr80" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>Export ATM / CR80 PDF (85.6×54mm)</span>
            </button>

            <button
              type="button"
              disabled={selectedMembers.length === 0 || exporting !== null}
              onClick={exportA4Pdf}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50 transition"
            >
              {exporting === "a4" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>Export A4 Sheet PDF (8 Cards/Page)</span>
            </button>

            <button
              type="button"
              disabled={selectedMembers.length === 0}
              onClick={() => window.print()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition"
            >
              <Download className="w-4 h-4" />
              <span>Browser Print Dialog</span>
            </button>
          </div>
        </aside>

        {/* Right Area: Live ATM/CR80 Card Previews */}
        <section className="lg:col-span-8 space-y-6">
          {(previewSide === "both" || previewSide === "back") && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 no-print">
                Card Back Side (Trust Logo — public/logo.png)
              </p>
              <div className="overflow-x-auto pb-2">
                <div className="inline-block shadow-xl rounded-[14px]">
                  <PvcIdCardBack />
                </div>
              </div>
            </div>
          )}

          {selectedMembers.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-slate-500">
              Select one or more approved members from the left panel to preview
              and export ATM-size CR80 PVC ID cards.
            </div>
          ) : (
            <div className="space-y-6">
              {(previewSide === "both" || previewSide === "front") && (
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 no-print">
                  Card Front Side ({selectedMembers.length} Selected)
                </p>
              )}
              {selectedMembers.map((m) => (
                <div
                  key={m.id}
                  className={
                    previewSide === "back"
                      ? "hidden"
                      : "overflow-x-auto pb-2"
                  }
                >
                  <div className="inline-block shadow-xl rounded-[14px]">
                    <div
                      ref={(el) => {
                        frontRefs.current[m.id] = el;
                      }}
                    >
                      <PvcIdCardFront member={m} siteUrl={siteUrl} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
