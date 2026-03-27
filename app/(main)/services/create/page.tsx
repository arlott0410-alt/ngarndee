import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ServiceCreateForm } from "@/components/ServiceCreateForm";

type Category = {
  id: string;
  name: string;
  name_lo: string | null;
};

export default async function CreateServicePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: "client" | "freelancer" | null }>();

  if (profile?.role !== "freelancer") {
    redirect("/dashboard");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, name_lo")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<Category[]>();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <ServiceCreateForm userId={user.id} categories={categories ?? []} />
    </main>
  );
}
