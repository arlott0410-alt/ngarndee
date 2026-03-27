"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type UserRole = "client" | "freelancer";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("ລະຫັດຜ່ານ ແລະ ການຢືນຢັນລະຫັດຜ່ານບໍ່ກົງກັນ");
      return;
    }

    setIsSubmitting(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !signUpData.user) {
      setErrorMessage("ສະໝັກບັນຊີບໍ່ສໍາເລັດ, ກະລຸນາລອງໃໝ່");
      setIsSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: signUpData.user.id,
      full_name: fullName,
      full_name_lo: fullName,
      role,
    });

    if (profileError) {
      setErrorMessage("ສ້າງໂປຣໄຟລບໍ່ສໍາເລັດ, ກະລຸນາລອງໃໝ່");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-orange-500">ງານດີ</h1>
          <p className="mt-2 text-sm text-gray-600">ສ້າງບັນຊີໃໝ່</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ຊື່ແທ້
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-orange-400"
              placeholder="ຕົວຢ່າງ: ອານຸສອນ ໄຊຍະວົງ"
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ຢືນຢັນລະຫັດຜ່ານ
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none transition focus:border-orange-400"
              placeholder="********"
              required
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              ຂ້ອຍຕ້ອງການ
            </p>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 p-3">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={role === "client"}
                  onChange={() => setRole("client")}
                  className="accent-orange-500"
                />
                <span className="text-sm">ຈ້າງຄົນ (Client)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 p-3">
                <input
                  type="radio"
                  name="role"
                  value="freelancer"
                  checked={role === "freelancer"}
                  onChange={() => setRole("freelancer")}
                  className="accent-orange-500"
                />
                <span className="text-sm">ຮັບງານ (Freelancer)</span>
              </label>
            </div>
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
            {isSubmitting ? "ກໍາລັງສະໝັກ..." : "ສະໝັກໃໝ່"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          ມີບັນຊີແລ້ວ?{" "}
          <Link href="/login" className="font-semibold text-orange-500">
            ເຂົ້າສູ່ລະບົບ
          </Link>
        </p>
      </div>
    </main>
  );
}
