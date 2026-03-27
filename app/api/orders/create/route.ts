import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type PackageType = "basic" | "standard" | "premium";

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
    const serviceId = String(body.service_id || "");
    const packageType = String(body.package_type || "basic") as PackageType;
    const requirements = String(body.requirements || "");
    const method = String(body.method || "bank_transfer");

    if (!serviceId) {
      return NextResponse.json(
        { error: "ຂໍ້ມູນບໍລິການບໍ່ຖືກຕ້ອງ" },
        { status: 400 },
      );
    }

    const { data: service } = await supabase
      .from("services")
      .select(
        "id, freelancer_id, title, title_lo, price_basic, price_standard, price_premium, delivery_days_basic, is_active",
      )
      .eq("id", serviceId)
      .maybeSingle<{
        id: string;
        freelancer_id: string;
        title: string;
        title_lo: string | null;
        price_basic: number;
        price_standard: number | null;
        price_premium: number | null;
        delivery_days_basic: number | null;
        is_active: boolean | null;
      }>();

    if (!service || !service.is_active) {
      return NextResponse.json(
        { error: "ບໍລິການນີ້ບໍ່ພ້ອມໃຊ້ງານ" },
        { status: 404 },
      );
    }

    if (service.freelancer_id === user.id) {
      return NextResponse.json(
        { error: "ບໍ່ສາມາດສັ່ງງານບໍລິການຂອງຕົນເອງ" },
        { status: 400 },
      );
    }

    const priceByPackage: Record<PackageType, number> = {
      basic: service.price_basic,
      standard: service.price_standard ?? service.price_basic,
      premium: service.price_premium ?? service.price_standard ?? service.price_basic,
    };

    const price = priceByPackage[packageType] ?? service.price_basic;
    const platformFee = Math.round(price * 0.15);
    const freelancerEarnings = price - platformFee;
    const totalAmount = price + platformFee;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (service.delivery_days_basic ?? 3));
    const orderNumber = `ND-${Date.now().toString().slice(-8)}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        service_id: service.id,
        client_id: user.id,
        freelancer_id: service.freelancer_id,
        package_type: packageType,
        title: service.title_lo || service.title,
        requirements,
        price,
        platform_fee: platformFee,
        freelancer_earnings: freelancerEarnings,
        status: "pending",
        payment_status: "pending",
        delivery_days: service.delivery_days_basic ?? 3,
        due_date: dueDate.toISOString(),
      })
      .select("id")
      .single<{ id: string }>();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "ສ້າງຄໍາສັ່ງບໍ່ສໍາເລັດ" },
        { status: 500 },
      );
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      payer_id: user.id,
      amount: totalAmount,
      currency: "LAK",
      method,
      status: "pending",
      transaction_ref: `PAY-${Date.now()}`,
    });

    if (paymentError) {
      return NextResponse.json(
        { error: "ສ້າງຂໍ້ມູນການຊຳລະບໍ່ສໍາເລັດ" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      order_id: order.id,
      message: "ສ້າງຄໍາສັ່ງສໍາເລັດ",
    });
  } catch {
    return NextResponse.json(
      { error: "ເກີດຂໍ້ຜິດພາດ, ກະລຸນາລອງໃໝ່" },
      { status: 500 },
    );
  }
}
