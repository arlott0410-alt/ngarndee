"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PackageType = "basic" | "standard" | "premium";

type PackageSelectorProps = {
  priceBasic: number;
  priceStandard: number | null;
  pricePremium: number | null;
};

function formatLak(price: number) {
  return `${new Intl.NumberFormat("lo-LA").format(price)} ກີບ`;
}

export function PackageSelector({
  serviceId,
  priceBasic,
  priceStandard,
  pricePremium,
}: PackageSelectorProps & { serviceId: string }) {
  const [selected, setSelected] = useState<PackageType>("basic");

  const currentPrice = useMemo(() => {
    if (selected === "premium" && pricePremium) return pricePremium;
    if (selected === "standard" && priceStandard) return priceStandard;
    return priceBasic;
  }, [selected, priceBasic, priceStandard, pricePremium]);

  const queryPackage =
    selected === "premium" ? "premium" : selected === "standard" ? "standard" : "basic";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-gray-900">ເລືອກແພັກເກດ</p>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setSelected("basic")}
          className={`rounded-xl border px-3 py-2 text-sm ${
            selected === "basic"
              ? "border-orange-500 bg-orange-50 text-orange-600"
              : "border-gray-200 text-gray-600"
          }`}
        >
          Basic
        </button>
        <button
          type="button"
          onClick={() => setSelected("standard")}
          className={`rounded-xl border px-3 py-2 text-sm ${
            selected === "standard"
              ? "border-orange-500 bg-orange-50 text-orange-600"
              : "border-gray-200 text-gray-600"
          }`}
        >
          Standard
        </button>
        <button
          type="button"
          onClick={() => setSelected("premium")}
          className={`rounded-xl border px-3 py-2 text-sm ${
            selected === "premium"
              ? "border-orange-500 bg-orange-50 text-orange-600"
              : "border-gray-200 text-gray-600"
          }`}
        >
          Premium
        </button>
      </div>

      <p className="mt-4 text-lg font-bold text-gray-900">{formatLak(currentPrice)}</p>
      <Link
        href={`/checkout/${serviceId}?package=${queryPackage}`}
        className="mt-4 block w-full rounded-xl bg-orange-500 px-4 py-2.5 text-center font-semibold text-white hover:bg-orange-600"
      >
        ສັ່ງງານ
      </Link>
    </div>
  );
}
