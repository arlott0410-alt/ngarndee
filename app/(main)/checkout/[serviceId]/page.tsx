import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CheckoutForm } from "@/components/CheckoutForm";

type PackageType = "basic" | "standard" | "premium";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ serviceId: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const { serviceId } = await params;
  const query = await searchParams;
  const packageType = (query.package || "basic") as PackageType;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: service } = await supabase
    .from("services")
    .select("id, title, title_lo, price_basic, price_standard, price_premium, is_active")
    .eq("id", serviceId)
    .maybeSingle<{
      id: string;
      title: string;
      title_lo: string | null;
      price_basic: number;
      price_standard: number | null;
      price_premium: number | null;
      is_active: boolean | null;
    }>();

  if (!service || !service.is_active) {
    redirect("/services");
  }

  const packagePriceMap: Record<PackageType, number> = {
    basic: service.price_basic,
    standard: service.price_standard ?? service.price_basic,
    premium: service.price_premium ?? service.price_standard ?? service.price_basic,
  };
  const price = packagePriceMap[packageType] ?? service.price_basic;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <CheckoutForm
        serviceId={service.id}
        serviceName={service.title_lo || service.title}
        packageType={packageType}
        price={price}
      />
    </main>
  );
}
