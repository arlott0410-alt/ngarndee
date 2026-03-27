import Link from "next/link";
import Image from "next/image";
import { CircleUserRound, Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Profile = {
  full_name: string | null;
  full_name_lo: string | null;
  username: string | null;
  avatar_url: string | null;
};

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "ງ";
}

export async function Navbar() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, full_name_lo, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    profile = data;
  }

  const displayName =
    profile?.full_name_lo || profile?.full_name || profile?.username || "ຜູ້ໃຊ້";

  async function logout() {
    "use server";
    const serverSupabase = await createSupabaseServerClient();
    await serverSupabase.auth.signOut();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="shrink-0 text-2xl font-bold text-orange-500">
          ງານດີ
        </Link>

        <form action="/services" className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            name="q"
            placeholder="ຄົ້ນຫາບໍລິການ..."
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
          />
        </form>

        {user ? (
          <details className="relative ml-auto">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
                  {getInitial(displayName)}
                </div>
              )}
              <span className="hidden text-sm text-gray-700 md:block">{displayName}</span>
            </summary>

            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
              <Link
                href="/dashboard"
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                ແດຊບອດ
              </Link>
              <Link
                href="/profile"
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                ໂປຣໄຟລ໌
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                >
                  ອອກຈາກລະບົບ
                </button>
              </form>
            </div>
          </details>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-orange-200 px-3 py-1.5 text-sm font-medium text-orange-600"
            >
              ເຂົ້າສູ່ລະບົບ
            </Link>
            <Link
              href="/register"
              className="hidden rounded-xl bg-orange-500 px-3 py-1.5 text-sm font-medium text-white sm:inline-flex"
            >
              ສະໝັກ
            </Link>
            <Link href="/login" className="sm:hidden">
              <CircleUserRound className="h-7 w-7 text-orange-500" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
