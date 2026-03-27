import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Profile = {
  full_name: string | null;
  full_name_lo: string | null;
  username: string | null;
  role: "client" | "freelancer" | null;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, full_name_lo, username, role")
    .eq("id", user.id)
    .single<Profile>();

  const displayName =
    profile?.full_name_lo || profile?.full_name || profile?.username || "ຜູ້ໃຊ້";

  const role = profile?.role ?? "client";

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          ສະບາຍດີ, {displayName}!
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          ຍິນດີຕ້ອນຮັບສູ່ແພລດຟອມ ງານດີ
        </p>

        <div className="mt-6">
          {role === "freelancer" ? (
            <Link
              href="/services/create"
              className="inline-flex rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-600"
            >
              ສ້າງບໍລິການ
            </Link>
          ) : (
            <Link
              href="/services"
              className="inline-flex rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-600"
            >
              ຊອກຫາ Freelancer
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
