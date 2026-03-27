"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type ProfileEditorProps = {
  userId: string;
  avatarUrl: string | null;
  fullName: string;
  bio: string;
};

export function ProfileEditor({ userId, avatarUrl, fullName, bio }: ProfileEditorProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [currentName, setCurrentName] = useState(fullName);
  const [currentBio, setCurrentBio] = useState(bio);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const fileInput = event.currentTarget.elements.namedItem(
      "avatar",
    ) as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    let nextAvatar = currentAvatar;
    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `avatars/${userId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        nextAvatar = data.publicUrl;
        setCurrentAvatar(data.publicUrl);
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: currentName,
        full_name_lo: currentName,
        bio: currentBio,
        bio_lo: currentBio,
        avatar_url: nextAvatar,
      })
      .eq("id", userId);

    setIsSaving(false);
    setMessage(error ? "ບັນທຶກບໍ່ສໍາເລັດ" : "ບັນທຶກສໍາເລັດແລ້ວ");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">ແກ້ໄຂໂປຣໄຟລ໌</h2>
      <div className="mt-4 flex items-center gap-4">
        <Image
          src={currentAvatar || "https://placehold.co/120x120/F3F4F6/9CA3AF?text=NgarnDee"}
          alt="avatar"
          width={72}
          height={72}
          unoptimized
          className="rounded-full object-cover"
        />
        <input
          type="file"
          name="avatar"
          accept="image/*"
          className="text-sm text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:text-orange-700"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-gray-700">ຊື່</label>
        <input
          value={currentName}
          onChange={(event) => setCurrentName(event.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-gray-700">ຂໍ້ມູນແນະນໍາຕົວ</label>
        <textarea
          value={currentBio}
          onChange={(event) => setCurrentBio(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-orange-400"
        />
      </div>

      {message ? <p className="mt-3 text-sm text-gray-600">{message}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 rounded-xl bg-orange-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        ບັນທຶກການປ່ຽນແປງ
      </button>
    </form>
  );
}
