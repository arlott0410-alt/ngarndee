import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

type OrderStatus = "pending" | "in_progress" | "delivered" | "completed" | "cancelled";
type Order = {
  id: string;
  order_number: string;
  service_id: string;
  client_id: string;
  freelancer_id: string;
  title: string;
  requirements: string | null;
  status: OrderStatus;
  due_date: string | null;
  price: number;
};

function formatLak(price: number) {
  return `${new Intl.NumberFormat("lo-LA").format(price)} ກີບ`;
}

function TimelineDot({ active }: { active: boolean }) {
  return (
    <span className={`h-3 w-3 rounded-full ${active ? "bg-orange-500" : "bg-gray-300"}`} />
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, service_id, client_id, freelancer_id, title, requirements, status, due_date, price")
    .eq("id", id)
    .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
    .maybeSingle<Order>();

  if (!order) redirect("/orders");

  const isFreelancer = user.id === order.freelancer_id;
  const isClient = user.id === order.client_id;

  async function updateStatus(formData: FormData) {
    "use server";
    const nextStatus = String(formData.get("status")) as OrderStatus;
    const serverSupabase = await createSupabaseServerClient();
    await serverSupabase.from("orders").update({ status: nextStatus }).eq("id", id);
    revalidatePath(`/orders/${id}`);
    revalidatePath("/orders");
  }

  const progress = {
    pending: 1,
    in_progress: 2,
    delivered: 3,
    completed: 4,
    cancelled: 1,
  }[order.status];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">#{order.order_number}</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{order.title}</h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-600">
          <p>ລາຄາ: {formatLak(order.price)}</p>
          <p>
            ວັນສົ່ງ:
            {order.due_date
              ? ` ${new Date(order.due_date).toLocaleDateString("lo-LA")}`
              : " -"}
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-900">ຂັ້ນຕອນງານ</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <TimelineDot active={progress >= 1} />
            <span>pending</span>
            <span>-</span>
            <TimelineDot active={progress >= 2} />
            <span>in_progress</span>
            <span>-</span>
            <TimelineDot active={progress >= 3} />
            <span>delivered</span>
            <span>-</span>
            <TimelineDot active={progress >= 4} />
            <span>completed</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-900">ຄວາມຕ້ອງການຈາກລູກຄ້າ</p>
          <p className="mt-2 text-sm text-gray-700">{order.requirements || "-"}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {isFreelancer && order.status !== "completed" && order.status !== "cancelled" ? (
            <form action={updateStatus}>
              <input type="hidden" name="status" value="delivered" />
              <button
                type="submit"
                className="rounded-xl bg-blue-500 px-4 py-2 font-semibold text-white"
              >
                ສົ່ງງານ
              </button>
            </form>
          ) : null}

          {isClient && order.status === "delivered" ? (
            <>
              <form action={updateStatus}>
                <input type="hidden" name="status" value="completed" />
                <button
                  type="submit"
                  className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-white"
                >
                  ຮັບງານ
                </button>
              </form>
              <form action={updateStatus}>
                <input type="hidden" name="status" value="in_progress" />
                <button
                  type="submit"
                  className="rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-white"
                >
                  ຂໍແກ້ໄຂ
                </button>
              </form>
            </>
          ) : null}

          <Link href={`/chat?order=${order.id}`} className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700">
            ໄປໜ້າແຊດ
          </Link>
        </div>
      </section>
    </main>
  );
}
