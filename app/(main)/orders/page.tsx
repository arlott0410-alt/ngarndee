import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

type SearchParams = { status?: string };
type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled" | "delivered";

type Order = {
  id: string;
  order_number: string;
  title: string;
  price: number;
  due_date: string | null;
  status: OrderStatus;
};

function formatLak(price: number) {
  return `${new Intl.NumberFormat("lo-LA").format(price)} ກີບ`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedStatus = params.status || "all";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let query = supabase
    .from("orders")
    .select("id, order_number, title, price, due_date, status")
    .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
    .order("id", { ascending: false });

  if (selectedStatus !== "all") {
    query = query.eq("status", selectedStatus);
  }

  const { data: orders } = await query.returns<Order[]>();

  const tabs = [
    { key: "all", label: "ທັງໝົດ" },
    { key: "in_progress", label: "ກຳລັງດຳເນີນ" },
    { key: "completed", label: "ສຳເລັດ" },
    { key: "cancelled", label: "ຍົກເລີກ" },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">ລາຍການຄໍາສັ່ງ</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/orders" : `/orders?status=${tab.key}`}
            className={`rounded-xl px-3 py-1.5 text-sm ${
              selectedStatus === tab.key
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-700 shadow-sm"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <section className="mt-5 space-y-3">
        {(orders ?? []).length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm">
            ຍັງບໍ່ມີຄໍາສັ່ງ
          </p>
        ) : (
          (orders ?? []).map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">#{order.order_number}</p>
                  <h2 className="mt-1 text-base font-semibold text-gray-900">{order.title}</h2>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                <p>ລາຄາ: {formatLak(order.price)}</p>
                <p>
                  ວັນສົ່ງ:
                  {order.due_date
                    ? ` ${new Date(order.due_date).toLocaleDateString("lo-LA")}`
                    : " -"}
                </p>
              </div>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
