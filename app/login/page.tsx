"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage("ອີເມລ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setErrorMessage("");
    setIsGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setErrorMessage("ບໍ່ສາມາດເຂົ້າລະບົບດ້ວຍ Google ໄດ້");
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-orange-500">ງານດີ</h1>
          <p className="mt-2 text-sm text-gray-600">ເຂົ້າສູ່ບັນຊີຂອງທ່ານ</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ອີເມລ
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-orange-400"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ລະຫັດຜ່ານ
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-orange-400"
              placeholder="********"
              required
            />
          </div>

          {errorMessage ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "ກໍາລັງເຂົ້າລະບົບ..." : "ເຂົ້າສູ່ລະບົບ"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleLoading
            ? "ກໍາລັງເປີດ Google..."
            : "ເຂົ້າສູ່ລະບົບດ້ວຍ Google"}
        </button>

        <p className="mt-5 text-center text-sm text-gray-600">
          ຍັງບໍ່ມີບັນຊີ?{" "}
          <Link href="/register" className="font-semibold text-orange-500">
            ສະໝັກໃໝ່
          </Link>
        </p>
      </div>
    </main>
  );
}
