import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const orderId = String(body.order_id || "");

    if (!orderId) {
      return NextResponse.json(
        { error: "ບໍ່ພົບລະຫັດຄໍາສັ່ງ" },
        { status: 400 },
      );
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, client_id, freelancer_id, status")
      .eq("id", orderId)
      .maybeSingle<{ id: string; client_id: string; freelancer_id: string; status: string }>();

    if (!order) {
      return NextResponse.json(
        { error: "ບໍ່ພົບຄໍາສັ່ງ" },
        { status: 404 },
      );
    }

    if (user.id !== order.client_id && user.id !== order.freelancer_id) {
      return NextResponse.json(
        { error: "ທ່ານບໍ່ມີສິດດຳເນີນການນີ້" },
        { status: 403 },
      );
    }

    if (order.status === "completed") {
      return NextResponse.json({ message: "ຄໍາສັ່ງນີ້ສໍາເລັດແລ້ວ" });
    }

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({ status: "completed", payment_status: "released" })
      .eq("id", orderId);

    if (orderUpdateError) {
      return NextResponse.json(
        { error: "ອັບເດດສະຖານະຄໍາສັ່ງບໍ່ສໍາເລັດ" },
        { status: 500 },
      );
    }

    const { error: paymentUpdateError } = await supabase
      .from("payments")
      .update({ status: "released" })
      .eq("order_id", orderId);

    if (paymentUpdateError) {
      return NextResponse.json(
        { error: "ອັບເດດສະຖານະການຊຳລະບໍ່ສໍາເລັດ" },
        { status: 500 },
      );
    }

    const { data: freelancerProfile } = await supabase
      .from("profiles")
      .select("id, completed_orders")
      .eq("id", order.freelancer_id)
      .maybeSingle<{ id: string; completed_orders: number | null }>();

    const completedOrders = freelancerProfile?.completed_orders ?? 0;
    await supabase
      .from("profiles")
      .update({ completed_orders: completedOrders + 1 })
      .eq("id", order.freelancer_id);

    return NextResponse.json({ message: "ປິດຄໍາສັ່ງສໍາເລັດ" });
  } catch {
    return NextResponse.json(
      { error: "ເກີດຂໍ້ຜິດພາດ, ກະລຸນາລອງໃໝ່" },
      { status: 500 },
    );
  }
}
