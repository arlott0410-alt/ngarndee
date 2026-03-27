import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ServiceCard } from "@/components/ServiceCard";

type Profile = {
  id: string;
  full_name: string | null;
  full_name_lo: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  bio_lo: string | null;
  role: "client" | "freelancer" | null;
  rating_avg: number | null;
};

type Service = {
  id: string;
  title: string;
  title_lo: string | null;
  images: string[] | null;
  price_basic: number;
  rating_avg: number | null;
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, full_name_lo, username, avatar_url, bio, bio_lo, role, rating_avg")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const displayName =
    profile?.full_name_lo || profile?.full_name || profile?.username || "ຜູ້ໃຊ້";

  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`);

  const { data: freelancerOrders } = await supabase
    .from("orders")
    .select("freelancer_earnings")
    .eq("freelancer_id", user.id)
    .eq("status", "completed")
    .returns<Array<{ freelancer_earnings: number | null }>>();

  const totalEarnings = (freelancerOrders ?? []).reduce(
    (sum, order) => sum + (order.freelancer_earnings ?? 0),
    0,
  );

  const { data: myServices } = await supabase
    .from("services")
    .select("id, title, title_lo, images, price_basic, rating_avg")
    .eq("freelancer_id", user.id)
    .eq("is_active", true)
    .order("id", { ascending: false })
    .limit(6)
    .returns<Service[]>();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">ໂປຣໄຟລ໌ຂອງຂ້ອຍ</h1>
        <div className="mt-5 flex items-center gap-4">
          <Image
            src={
              profile?.avatar_url ||
              "https://placehold.co/128x128/F3F4F6/9CA3AF?text=NgarnDee"
            }
            alt={displayName}
            width={72}
            height={72}
            unoptimized
            className="h-18 w-18 rounded-full object-cover"
          />
          <div>
            <p className="text-lg font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-gray-700">
          {profile?.bio_lo || profile?.bio || "ຍັງບໍ່ມີຂໍ້ມູນແນະນໍາຕົວ"}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">ຈໍານວນຄໍາສັ່ງ</p>
            <p className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat("lo-LA").format(orderCount ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">ຄະແນນສະເລ່ຍ</p>
            <p className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat("lo-LA").format(profile?.rating_avg ?? 0)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">ລາຍໄດ້ລວມ</p>
            <p className="text-lg font-bold text-gray-900">
              {new Intl.NumberFormat("lo-LA").format(totalEarnings)} ກີບ
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <ProfileEditor
          userId={user.id}
          avatarUrl={profile?.avatar_url ?? null}
          fullName={displayName}
          bio={profile?.bio_lo || profile?.bio || ""}
        />
      </div>

      {profile?.role === "freelancer" ? (
        <section className="mt-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">ບໍລິການຂອງຂ້ອຍ</h2>
            <Link href="/services/create" className="text-sm font-semibold text-orange-500">
              ສ້າງບໍລິການ
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(myServices ?? []).map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                title={service.title_lo || service.title}
                imageUrl={Array.isArray(service.images) ? service.images[0] : null}
                freelancerName={displayName}
                freelancerAvatar={profile?.avatar_url}
                price={service.price_basic}
                rating={service.rating_avg}
                reviewCount={0}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
