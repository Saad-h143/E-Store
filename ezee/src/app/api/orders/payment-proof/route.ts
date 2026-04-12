import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cacheSet, CACHE_KEYS } from "@/lib/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const orderId = formData.get("orderId") as string;

    if (!file || !orderId) {
      return NextResponse.json({ error: "File and orderId are required" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `payment-proofs/${orderId}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Payment Proof] Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
    const proofUrl = urlData.publicUrl;

    // Update order with payment proof URL
    const { error: updateError } = await supabase
      .from("orders")
      .update({ payment_proof: proofUrl })
      .eq("id", orderId);

    if (updateError) {
      console.error("[Payment Proof] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    // Invalidate orders cache so admin sees it immediately
    cacheSet(CACHE_KEYS.ORDERS, null, 0);

    return NextResponse.json({ success: true, url: proofUrl });
  } catch (err) {
    console.error("[Payment Proof] Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
