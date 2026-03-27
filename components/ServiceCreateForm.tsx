"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type Category = { id: string; name: string; name_lo: string | null };

export function ServiceCreateForm({
  userId,
  categories,
}: {
  userId: string;
  categories: Category[];
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "");
    const categoryId = String(form.get("category_id") || "");
    const description = String(form.get("description") || "");
    const priceBasic = Number(form.get("price_basic") || 0);
    const priceStandard = Number(form.get("price_standard") || 0);
    const pricePremium = Number(form.get("price_premium") || 0);
    const deliveryDays = Number(form.get("delivery_days") || 1);
    const tags = String(form.get("tags") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const imageInput = event.currentTarget.elements.namedItem(
      "images",
    ) as HTMLInputElement | null;
    const files = imageInput?.files ? Array.from(imageInput.files).slice(0, 5) : [];

    const uploadedImages: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `services/${userId}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("service-images")
        .upload(path, file, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from("service-images").getPublicUrl(path);
        uploadedImages.push(data.publicUrl);
      }
    }

    const { data, error } = await supabase
      .from("services")
      .insert({
        freelancer_id: userId,
        category_id: categoryId,
        title,
        title_lo: title,
        description,
        description_lo: description,
        price_basic: priceBasic,
        price_standard: priceStandard || priceBasic,
        price_premium: pricePremium || priceStandard || priceBasic,
        delivery_days_basic: deliveryDays,
        images: uploadedImages,
        tags,
        is_active: true,
      })
      .select("id")
      .single<{ id: string }>();

    setIsSubmitting(false);
    if (error || !data) {
      setMessage("ສ້າງບໍລິການບໍ່ສໍາເລັດ");
      return;
    }

    router.push(`/services/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">ສ້າງບໍລິການ</h1>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-gray-700">ຊື່ບໍລິການ (ລາວ)</label>
          <input
            name="title"
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">ໝວດໝູ່</label>
          <select
            name="category_id"
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
          >
            <option value="">ເລືອກໝວດໝູ່</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_lo || category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">ຈໍານວນວັນສົ່ງງານ</label>
          <input
            name="delivery_days"
            type="number"
            min={1}
            defaultValue={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-gray-700">ຄໍາອະທິບາຍ</label>
          <textarea
            name="description"
            rows={5}
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">ລາຄາ Basic (ກີບ)</label>
          <input name="price_basic" type="number" min={1} required className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">ລາຄາ Standard (ກີບ)</label>
          <input name="price_standard" type="number" min={1} className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">ລາຄາ Premium (ກີບ)</label>
          <input name="price_premium" type="number" min={1} className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">Tags (ແຍກດ້ວຍ ,)</label>
          <input name="tags" placeholder="logo, design" className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-gray-700">ຮູບພາບບໍລິການ</label>
          <input
            name="images"
            type="file"
            accept="image/*"
            multiple
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:text-orange-700"
          />
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-red-600">{message}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isSubmitting ? "ກໍາລັງສ້າງ..." : "ສ້າງບໍລິການ"}
      </button>
    </form>
  );
}
