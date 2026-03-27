import Link from "next/link";
import Image from "next/image";
import { Bookmark, Star } from "lucide-react";

type ServiceCardProps = {
  id: string;
  title: string;
  imageUrl?: string | null;
  freelancerName: string;
  freelancerAvatar?: string | null;
  price: number;
  rating?: number | null;
  reviewCount?: number | null;
};

function formatLak(price: number) {
  return `${new Intl.NumberFormat("lo-LA").format(price)} ກີບ`;
}

export function ServiceCard({
  id,
  title,
  imageUrl,
  freelancerName,
  freelancerAvatar,
  price,
  rating,
  reviewCount,
}: ServiceCardProps) {
  const safeRating = rating ?? 0;
  const safeReviewCount = reviewCount ?? 0;

  return (
    <article className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <Link href={`/services/${id}`} className="block">
        <div className="relative h-40 w-full bg-gray-100">
          <Image
            src={imageUrl || "https://placehold.co/640x360/F3F4F6/9CA3AF?text=NgarnDee"}
            alt={title}
            fill
            unoptimized
            className="object-cover"
          />
          <button
            type="button"
            aria-label="ບັນທຶກບໍລິການ"
            className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-gray-600 shadow-sm"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Image
            src={
              freelancerAvatar ||
              "https://placehold.co/80x80/F3F4F6/9CA3AF?text=%E0%BA%87%E0%BA%B2%E0%BA%99"
            }
            alt={freelancerName}
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 rounded-full object-cover"
          />
          <p className="text-sm text-gray-700">{freelancerName}</p>
        </div>

        <Link href={`/services/${id}`}>
          <h3 className="line-clamp-2 min-h-12 text-sm font-semibold text-gray-900">
            {title}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-1 text-sm text-amber-500">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-medium text-gray-900">{safeRating.toFixed(1)}</span>
          <span className="text-gray-500">({safeReviewCount})</span>
        </div>

        <p className="mt-3 text-sm font-semibold text-gray-900">
          ເລີ່ມຕົ້ນ {formatLak(price)}
        </p>
      </div>
    </article>
  );
}
