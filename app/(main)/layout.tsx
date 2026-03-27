import Link from "next/link";
import { Home, Search, ShoppingBag, MessageCircle, UserRound } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pb-20 md:pb-8">{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white md:hidden">
        <div className="grid grid-cols-5">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-gray-600"
          >
            <Home className="h-4 w-4" />
            <span>ໜ້າຫຼັກ</span>
          </Link>
          <Link
            href="/services"
            className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-gray-600"
          >
            <Search className="h-4 w-4" />
            <span>ຄົ້ນຫາ</span>
          </Link>
          <Link
            href="/orders"
            className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-gray-600"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>ຄຳສັ່ງ</span>
          </Link>
          <Link
            href="/chat"
            className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-gray-600"
          >
            <MessageCircle className="h-4 w-4" />
            <span>ແຊດ</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] text-gray-600"
          >
            <UserRound className="h-4 w-4" />
            <span>ໂປຣໄຟລ໌</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
