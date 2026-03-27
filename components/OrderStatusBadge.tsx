type OrderStatus = "pending" | "in_progress" | "delivered" | "completed" | "cancelled";

const statusMap: Record<OrderStatus, { label: string; className: string }> = {
  pending: {
    label: "ລໍຖ້າ",
    className: "bg-yellow-100 text-yellow-700",
  },
  in_progress: {
    label: "ກຳລັງດຳເນີນ",
    className: "bg-blue-100 text-blue-700",
  },
  delivered: {
    label: "ສົ່ງແລ້ວ",
    className: "bg-indigo-100 text-indigo-700",
  },
  completed: {
    label: "ສຳເລັດ",
    className: "bg-green-100 text-green-700",
  },
  cancelled: {
    label: "ຍົກເລີກ",
    className: "bg-red-100 text-red-700",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const item = statusMap[status] ?? statusMap.pending;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.className}`}>
      {item.label}
    </span>
  );
}
