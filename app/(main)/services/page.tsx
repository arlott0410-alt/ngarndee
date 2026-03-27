import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ServiceCard } from "@/components/ServiceCard";

type SearchParams = {
  q?: string;
  category?: string;
  sort?: string;
};

type Service = {
  id: string;
  title: string;
  title_lo: string | null;
  images: string[] | null;
  price_basic: number;
  rating_avg: number | null;
  freelancer_id: string;
  category_id: string;
};

type Category = {
  id: string;
  name: string;
  name_lo: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  full_name_lo: string | null;
  username: string | null;
  avatar_url: string | null;
  rating_count: number | null;
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const selectedCategory = params.category || "";
  const keyword = params.q || "";
  const sort = params.sort || "newest";

  let query = supabase
    .from("services")
    .select(
      "id, title, title_lo, images, price_basic, rating_avg, freelancer_id, category_id",
    )
    .eq("is_active", true);

  if (selectedCategory) {
    query = query.eq("category_id", selectedCategory);
  }

  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,title_lo.ilike.%${keyword}%`);
  }

  if (sort === "price_asc") {
    query = query.order("price_basic", { ascending: true });
  } else if (sort === "rating_desc") {
    query = query.order("rating_avg", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("id", { ascending: false });
  }

  const { data: services } = await query.limit(24).returns<Service[]>();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, name_lo")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<Category[]>();

  const freelancerIds = [...new Set((services ?? []).map((item) => item.freelancer_id))];
  const profileMap = new Map<string, Profile>();

  if (freelancerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, full_name_lo, username, avatar_url, rating_count")
      .in("id", freelancerIds)
      .returns<Profile[]>();

    (profiles ?? []).forEach((item) => profileMap.set(item.id, item));
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">ຄົ້ນຫາບໍລິການ</h1>

      <form className="mt-4 grid gap-3 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          type="search"
          name="q"
          defaultValue={keyword}
          placeholder="ຄົ້ນຫາ..."
          className="rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400 md:col-span-2"
        />

        <select
          name="category"
          defaultValue={selectedCategory}
          className="rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
        >
          <option value="">ທຸກໝວດໝູ່</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name_lo || category.name}
            </option>
          ))}
        </select>

        <select
          name="sort"
          defaultValue={sort}
          className="rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
        >
          <option value="price_asc">ລາຄາຕໍ່າ-ສູງ</option>
          <option value="rating_desc">ຄະແນນດີ</option>
          <option value="newest">ໃໝ່ສຸດ</option>
        </select>

        <button
          type="submit"
          className="rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white md:col-span-4"
        >
          ນໍາໃຊ້ຕົວກອງ
        </button>
      </form>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                profile?.full_name_lo || profile?.full_name || profile?.username || "Freelancer"
              }
              freelancerAvatar={profile?.avatar_url}
              price={service.price_basic}
              rating={service.rating_avg}
              reviewCount={profile?.rating_count}
            />
          );
        })}
      </section>
    </main>
  );
}
