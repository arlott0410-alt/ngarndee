import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { FreelancerOrdersChart } from "@/components/FreelancerOrdersChart";

function formatLak(price: number) {
  return `${new Intl.NumberFormat("lo-LA").format(price)} ກີບ`;
}

type OrderRow = {
  freelancer_earnings: number | null;
  status: string | null;
  created_at: string;
};

export default async function FreelancerDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, rating_avg")
    .eq("id", user.id)
    .maybeSingle<{ role: "client" | "freelancer" | null; rating_avg: number | null }>();

  if (profile?.role !== "freelancer") {
    redirect("/dashboard");
  }

  const { data: orderRows } = await supabase
    .from("orders")
    .select("freelancer_earnings, status, created_at")
    .eq("freelancer_id", user.id)
    .returns<OrderRow[]>();

  const now = new Date();
  const todayStr = now.toDateString();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let todayIncome = 0;
  let monthIncome = 0;
  let totalIncome = 0;
  let pendingCount = 0;

  const chartMap = new Map<string, number>();

  for (const row of orderRows ?? []) {
    const createdAt = new Date(row.created_at);
    const earnings = row.freelancer_earnings ?? 0;
    const status = row.status || "";

    if (status === "pending" || status === "in_progress" || status === "delivered") {
      pendingCount += 1;
    }

    const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    chartMap.set(monthKey, (chartMap.get(monthKey) ?? 0) + 1);

    if (status === "completed") {
      totalIncome += earnings;
      if (createdAt.toDateString() === todayStr) {
        todayIncome += earnings;
      }
      if (createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear) {
        monthIncome += earnings;
      }
    }
  }

  const chartData = Array.from(chartMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(-12)
    .map(([month, orders]) => ({ month, orders }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">ແດຊບອດ Freelancer</h1>
        <Link href="/orders" className="text-sm font-semibold text-orange-500">
          ເບິ່ງຄໍາສັ່ງທັງໝົດ
        </Link>
      </div>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">ລາຍໄດ້ມື້ນີ້</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatLak(todayIncome)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">ລາຍໄດ້ເດືອນນີ້</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatLak(monthIncome)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">ລາຍໄດ້ທັງໝົດ</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatLak(totalIncome)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">ຄະແນນສະເລ່ຍ</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {new Intl.NumberFormat("lo-LA").format(profile?.rating_avg ?? 0)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            ຄໍາສັ່ງທີ່ລໍດໍາເນີນ: {new Intl.NumberFormat("lo-LA").format(pendingCount)}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">ກຣາຟຄໍາສັ່ງລາຍເດືອນ</h2>
        <p className="mt-1 text-sm text-gray-500">ສະແດງຈໍານວນຄໍາສັ່ງຍ້ອນຫຼັງ 12 ເດືອນ</p>
        <div className="mt-4">
          <FreelancerOrdersChart data={chartData} />
        </div>
      </section>
    </main>
  );
}
