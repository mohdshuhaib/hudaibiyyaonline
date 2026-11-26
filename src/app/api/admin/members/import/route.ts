import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/server";

interface CsvMemberInput {
  membership_id?: string;
  full_name: string;
  fathers_name: string;
  dob: string;
  blood_group?: string;
  marital_status?: string;
  phone: string;
  whatsapp?: string;
  islamic_qualification?: string;
  general_education?: string;
  profession?: string;
  residence_type?: string;
  current_region?: string;
  current_address?: string;
  house_name?: string;
  place_po?: string;
  post_office?: string;
  district?: string;
  pincode?: string;
  subscription_type?: string;
  subscription_amount?: string;
  validity_date?: string;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = (await request.json()) as { rows?: CsvMemberInput[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No CSV rows provided" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch existing phones and membership_ids to validate duplicates & compute next HUD number
    const { data: existing, error: fetchError } = await supabase
      .from("members")
      .select("phone, membership_id");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingPhones = new Set(
      (existing ?? []).map((m) => (m.phone ?? "").trim())
    );
    const existingIds = new Set(
      (existing ?? []).map((m) => (m.membership_id ?? "").trim()).filter(Boolean)
    );

    let nextGapSearch = 1;
    const getNextAvailableHudId = () => {
      while (existingIds.has(`HUD-${String(nextGapSearch).padStart(4, "0")}`)) {
        nextGapSearch += 1;
      }
      const id = `HUD-${String(nextGapSearch).padStart(4, "0")}`;
      nextGapSearch += 1;
      return id;
    };

    const skipped: { row: number; phone: string; reason: string }[] = [];
    const toInsert: Record<string, unknown>[] = [];
    const batchPhones = new Set<string>();

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const phone = (r.phone ?? "").trim();
      const fullName = (r.full_name ?? "").trim();

      if (!fullName || !phone) {
        skipped.push({
          row: rowNum,
          phone: phone || "(empty)",
          reason: "Missing full_name or phone",
        });
        return;
      }

      if (existingPhones.has(phone) || batchPhones.has(phone)) {
        skipped.push({
          row: rowNum,
          phone,
          reason: "Duplicate phone number",
        });
        return;
      }

      batchPhones.add(phone);

      let membershipId = (r.membership_id ?? "").trim();
      if (!membershipId || existingIds.has(membershipId)) {
        membershipId = getNextAvailableHudId();
      }
      existingIds.add(membershipId);

      const resType =
        r.residence_type?.trim() === "Abroad" ? "Abroad" : "Naatil";
      const subType = "Maasavari";

      toInsert.push({
        membership_id: membershipId,
        status: "approved",
        full_name: fullName,
        fathers_name: (r.fathers_name ?? "-").trim() || "-",
        dob: (r.dob ?? "1990-01-01").trim() || "1990-01-01",
        blood_group: r.blood_group?.trim() || null,
        marital_status: r.marital_status?.trim() || null,
        phone,
        whatsapp: (r.whatsapp ?? phone).trim() || phone,
        islamic_qualification: r.islamic_qualification
          ? r.islamic_qualification
              .split(";")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        general_education: (r.general_education ?? "SSLC / 10th").trim(),
        profession: (r.profession ?? "Other").trim(),
        residence_type: resType,
        current_region: (
          r.current_region ?? (resType === "Naatil" ? "Kerala" : "UAE - Dubai")
        ).trim(),
        current_address: (r.current_address ?? "-").trim(),
        house_name: (r.house_name ?? "-").trim(),
        place_po: (r.place_po ?? "-").trim(),
        post_office: (r.post_office ?? "").trim(),
        district: (r.district ?? "Malappuram").trim(),
        pincode: (r.pincode ?? "000000").trim(),
        subscription_type: subType,
        subscription_amount: (r.subscription_amount ?? "200").trim(),
        validity_date: (r.validity_date ?? "2028-12-31").trim() || "2028-12-31",
      });
    });

    let insertedCount = 0;
    if (toInsert.length > 0) {
      // Insert in chunks of 100
      for (let i = 0; i < toInsert.length; i += 100) {
        const chunk = toInsert.slice(i, i + 100);
        const { error: insertError, data: inserted } = await supabase
          .from("members")
          .insert(chunk)
          .select("id");

        if (insertError) {
          return NextResponse.json(
            {
              error: `Bulk insert failed at batch ${i / 100 + 1}: ${insertError.message}`,
              insertedCount,
              skipped,
            },
            { status: 500 }
          );
        }
        insertedCount += inserted?.length ?? chunk.length;
      }
    }

    return NextResponse.json({
      insertedCount,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "CSV import failed" },
      { status: 500 }
    );
  }
}
