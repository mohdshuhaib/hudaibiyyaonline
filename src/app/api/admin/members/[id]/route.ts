import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    // Whitelist editable fields
    const allowedFields = [
      "full_name",
      "fathers_name",
      "photo_url",
      "dob",
      "blood_group",
      "marital_status",
      "wife_name",
      "children_count",
      "children_details",
      "phone",
      "whatsapp",
      "email",
      "islamic_qualification",
      "general_education",
      "profession",
      "residence_type",
      "current_region",
      "current_address",
      "house_name",
      "place_po",
      "post_office",
      "district",
      "pincode",
      "house_status",
      "shaikhuna_connection",
      "shaikhuna_lineage",
      "subscription_type",
      "subscription_amount",
      "status",
      "validity_date",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updates[key] = body[key];
      }
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ member: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const supabase = createAdminClient();
    const { error } = await supabase.from("members").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete member" },
      { status: 500 }
    );
  }
}
