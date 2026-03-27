"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentMethod = "bcel_one" | "jdb" | "bank_transfer";
type PackageType = "basic" | "standard" | "premium";

function formatLak(price: number) {
  return `${new Intl.NumberFormat("lo-LA").format(price)} ກີບ`;
}

export function CheckoutForm({
  serviceId,
  serviceName,
  packageType,
  price,
}: {
  serviceId: string;
  serviceName: string;
  packageType: PackageType;
  price: number;
}) {
  const router = useRouter();
  const [requirements, setRequirements] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bcel_one");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const platformFee = Math.round(price * 0.15);
  const total = price + platformFee;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          package_type: packageType,
          requirements,
          method,
        }),
      });

      const data = (await response.json()) as { order_id?: string; error?: string };

      if (!response.ok || !data.order_id) {
        setErrorMessage(data.error || "ຊຳລະເງິນບໍ່ສໍາເລັດ");
        setIsSubmitting(false);
        return;
      }

      router.push(`/orders/${data.order_id}`);
      router.refresh();
    } catch {
      setErrorMessage("ເຊື່ອມຕໍ່ລະບົບບໍ່ສໍາເລັດ");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">ຢືນຢັນການຊື້ບໍລິການ</h1>

      <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
        <p className="font-semibold text-gray-900">{serviceName}</p>
        <p className="text-gray-700">ແພັກເກດ: {packageType}</p>
        <p className="text-gray-700">ລາຄາ: {formatLak(price)}</p>
        <p className="text-gray-700">ຄ່າບໍລິການ 15%: {formatLak(platformFee)}</p>
        <p className="text-base font-bold text-gray-900">ລວມທັງໝົດ: {formatLak(total)}</p>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-gray-700">ລາຍລະອຽດຄວາມຕ້ອງການ</label>
        <textarea
          value={requirements}
          onChange={(event) => setRequirements(event.target.value)}
          rows={4}
          placeholder="ອະທິບາຍສິ່ງທີ່ຕ້ອງການ..."
          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm text-gray-700">ເລືອກວິທີຊຳລະ</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3">
            <input
              type="radio"
              name="method"
              checked={method === "bcel_one"}
              onChange={() => setMethod("bcel_one")}
              className="accent-orange-500"
            />
            <span className="text-sm">BCEL One</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3">
            <input
              type="radio"
              name="method"
              checked={method === "jdb"}
              onChange={() => setMethod("jdb")}
              className="accent-orange-500"
            />
            <span className="text-sm">JDB</span>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 p-3">
            <input
              type="radio"
              name="method"
              checked={method === "bank_transfer"}
              onChange={() => setMethod("bank_transfer")}
              className="accent-orange-500"
            />
            <span className="text-sm">ໂອນທະນາຄານ</span>
          </label>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "ກໍາລັງດໍາເນີນ..." : "ຊຳລະເງິນ"}
      </button>
    </form>
  );
}
