import { Star } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PackageSelector } from "@/components/PackageSelector";

type Service = {
  id: string;
  title: string;
  title_lo: string | null;
  description: string | null;
  description_lo: string | null;
  images: string[] | null;
  price_basic: number;
  price_standard: number | null;
  price_premium: number | null;
  rating_avg: number | null;
  freelancer_id: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  full_name_lo: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  bio_lo: string | null;
  rating_avg: number | null;
};

type Review = {
  id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  comment_lo: string | null;
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: service } = await supabase
    .from("services")
    .select(
      "id, title, title_lo, description, description_lo, images, price_basic, price_standard, price_premium, rating_avg, freelancer_id",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle<Service>();

  if (!service) {
    notFound();
  }

  const { data: freelancer } = await supabase
    .from("profiles")
    .select("id, full_name, full_name_lo, username, avatar_url, bio, bio_lo, rating_avg")
    .eq("id", service.freelancer_id)
    .maybeSingle<Profile>();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, reviewer_id, rating, comment, comment_lo")
    .eq("service_id", service.id)
    .order("id", { ascending: false })
    .limit(10)
    .returns<Review[]>();

  const reviewerIds = [...new Set((reviews ?? []).map((item) => item.reviewer_id))];
  const reviewerNameMap = new Map<string, string>();

  if (reviewerIds.length > 0) {
    const { data: reviewerProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, full_name_lo, username")
      .in("id", reviewerIds)
      .returns<Array<Pick<Profile, "id" | "full_name" | "full_name_lo" | "username">>>();

    (reviewerProfiles ?? []).forEach((item) => {
      reviewerNameMap.set(
        item.id,
        item.full_name_lo || item.full_name || item.username || "ຜູ້ໃຊ້",
      );
    });
  }

  const images = Array.isArray(service.images) ? service.images : [];
  const headerImage =
    images[0] || "https://placehold.co/1200x680/F3F4F6/9CA3AF?text=NgarnDee+Service";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-5 lg:col-span-2">
          <article className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="relative h-72 w-full">
              <Image
                src={headerImage}
                alt={service.title_lo || service.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-2 p-3">
                {images.slice(1, 5).map((item) => (
                  <Image
                    key={item}
                    src={item}
                    alt="ຮູບບໍລິການ"
                    width={160}
                    height={80}
                    unoptimized
                    className="h-20 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : null}
          </article>

          <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              {service.title_lo || service.title}
            </h1>
            <div className="mt-2 flex items-center gap-1 text-sm text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium text-gray-900">
                {(service.rating_avg ?? 0).toFixed(1)}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {service.description_lo || service.description || "ບໍ່ມີຄໍາອະທິບາຍ"}
            </p>
          </article>

          <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">ຄວາມຄິດເຫັນຈາກລູກຄ້າ</h2>
            <div className="mt-4 space-y-3">
              {(reviews ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">ຍັງບໍ່ມີຄວາມຄິດເຫັນ</p>
              ) : (
                (reviews ?? []).map((review) => (
                  <div key={review.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {reviewerNameMap.get(review.reviewer_id) || "ຜູ້ໃຊ້"}
                      </p>
                      <p className="text-sm text-amber-500">{review.rating.toFixed(1)} ★</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {review.comment_lo || review.comment || "-"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <aside className="space-y-4">
          <PackageSelector
            serviceId={service.id}
            priceBasic={service.price_basic}
            priceStandard={service.price_standard}
            pricePremium={service.price_premium}
          />

          <article className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">ຂໍ້ມູນ Freelancer</h2>
            <div className="mt-3 flex items-center gap-3">
              <Image
                src={
                  freelancer?.avatar_url ||
                  "https://placehold.co/96x96/F3F4F6/9CA3AF?text=Freelancer"
                }
                alt="freelancer"
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {freelancer?.full_name_lo ||
                    freelancer?.full_name ||
                    freelancer?.username ||
                    "Freelancer"}
                </p>
                <p className="text-xs text-gray-500">
                  ຄະແນນ {new Intl.NumberFormat("lo-LA").format(freelancer?.rating_avg ?? 0)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              {freelancer?.bio_lo || freelancer?.bio || "ບໍ່ມີລາຍລະອຽດເພີ່ມເຕີມ"}
            </p>
          </article>
        </aside>
      </div>
    </main>
  );
}
