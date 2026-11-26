import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Member } from "@/types/member";

export async function POST(
  request: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await context.params;
    const decodedId = decodeURIComponent(memberId).trim().toUpperCase();
    const { passcode } = (await request.json()) as { passcode?: string };

    if (!passcode || !passcode.trim()) {
      return NextResponse.json(
        { error: "Passcode is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("membership_id", decodedId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Member record not found" },
        { status: 404 }
      );
    }

    const member = data as Member;
    const phoneDigits = (member.phone ?? "").replace(/\D/g, "");
    const lastTwoDigits = phoneDigits.slice(-2);
    const expectedPasscode = `${(member.membership_id ?? "").toUpperCase()}${lastTwoDigits}`;

    if (passcode.trim().toUpperCase() !== expectedPasscode) {
      return NextResponse.json(
        { error: "Invalid passcode. Please check and try again." },
        { status: 401 }
      );
    }

    const isExpired =
      new Date(member.validity_date) < new Date(new Date().toDateString());
    const isActive = member.status === "approved" && !isExpired;

    return NextResponse.json({ member, isActive });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}
