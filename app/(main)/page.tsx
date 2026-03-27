import Link from "next/link";
import { Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ServiceCard } from "@/components/ServiceCard";

type Category = {
  id: string;
  name: string;
  name_lo: string | null;
  icon: string | null;
  slug: string;
};

type Service = {
  id: string;
  title: string;
  title_lo: string | null;
  images: string[] | null;
  price_basic: number;
  rating_avg: number | null;
  freelancer_id: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  full_name_lo: string | null;
  username: string | null;
  avatar_url: string | null;
  rating_count: number | null;
};

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, name_lo, icon, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<Category[]>();

  const { data: services } = await supabase
    .from("services")
    .select("id, title, title_lo, images, price_basic, rating_avg, freelancer_id")
    .eq("is_active", true)
    .order("rating_avg", { ascending: false, nullsFirst: false })
    .limit(8)
    .returns<Service[]>();

  const freelancerIds = [...new Set((services ?? []).map((item) => item.freelancer_id))];
  const profileMap = new Map<string, Profile>();

  if (freelancerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, full_name_lo, username, avatar_url, rating_count")
      .in("id", freelancerIds)
      .returns<Profile[]>();

    (profiles ?? []).forEach((item) => {
      profileMap.set(item.id, item);
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          ຊອກຫາ Freelancer ທີ່ດີທີ່ສຸດໃນລາວ
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          ຄົ້ນຫາບໍລິການຄຸນນະພາບສູງ ສໍາລັບທຸກຄວາມຕ້ອງການຂອງທ່ານ
        </p>

        <form action="/services" className="relative mt-4 max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            placeholder="ພິມຄຳທີ່ທ່ານຕ້ອງການ..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-9 pr-4 outline-none focus:border-orange-400"
          />
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">ໝວດໝູ່ຍອດນິຍົມ</h2>
          <Link href="/services" className="text-sm font-medium text-orange-500">
            ເບິ່ງທັງໝົດ
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {(categories ?? []).map((category) => (
            <Link
              key={category.id}
              href={`/services?category=${category.id}`}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-orange-200"
            >
              <p className="text-sm font-semibold text-gray-900">
                {category.icon ? `${category.icon} ` : ""}
                {category.name_lo || category.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">ບໍລິການແນະນໍາ</h2>
          <Link href="/services" className="text-sm font-medium text-orange-500">
            ເບິ່ງເພີ່ມ
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(services ?? []).map((service) => {
            const profile = profileMap.get(service.freelancer_id);
            const imageUrl =
              Array.isArray(service.images) && service.images.length > 0
                ? service.images[0]
                : null;

            return (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title_lo || service.title}
                imageUrl={imageUrl}
                freelancerName={
                  profile?.full_name_lo ||
                  profile?.full_name ||
                  profile?.username ||
                  "Freelancer"
                }
                freelancerAvatar={profile?.avatar_url}
                price={service.price_basic}
                rating={service.rating_avg}
                reviewCount={profile?.rating_count}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
