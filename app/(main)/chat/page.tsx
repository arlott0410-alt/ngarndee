import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type Conversation = {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  full_name_lo: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default async function ChatListPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2, last_message, last_message_at")
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .returns<Conversation[]>();

  const partnerIds = [...new Set(
    (conversations ?? []).map((conversation) =>
      conversation.participant_1 === user.id ? conversation.participant_2 : conversation.participant_1,
    ),
  )];

  const profileMap = new Map<string, Profile>();
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, full_name_lo, username, avatar_url")
      .in("id", partnerIds)
      .returns<Profile[]>();
    (profiles ?? []).forEach((profile) => profileMap.set(profile.id, profile));
  }

  const unreadMap = new Map<string, number>();
  for (const conversation of conversations ?? []) {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversation.id)
      .eq("is_read", false)
      .neq("sender_id", user.id);
    unreadMap.set(conversation.id, count ?? 0);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">ກ່ອງຂໍ້ຄວາມ</h1>

      <section className="mt-4 space-y-3">
        {(conversations ?? []).length === 0 ? (
          <p className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow-sm">
            ຍັງບໍ່ມີການສົນທະນາ
          </p>
        ) : (
          (conversations ?? []).map((conversation) => {
            const partnerId =
              conversation.participant_1 === user.id
                ? conversation.participant_2
                : conversation.participant_1;
            const partner = profileMap.get(partnerId);
            const name =
              partner?.full_name_lo || partner?.full_name || partner?.username || "ຜູ້ໃຊ້";
            const unreadCount = unreadMap.get(conversation.id) || 0;

            return (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <Image
                  src={
                    partner?.avatar_url ||
                    "https://placehold.co/96x96/F3F4F6/9CA3AF?text=Chat"
                  }
                  alt={name}
                  width={44}
                  height={44}
                  unoptimized
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                  <p className="truncate text-sm text-gray-600">
                    {conversation.last_message || "ເລີ່ມການສົນທະນາ"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {conversation.last_message_at
                      ? new Date(conversation.last_message_at).toLocaleTimeString("lo-LA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                  {unreadCount > 0 ? (
                    <span className="mt-1 inline-flex min-w-5 justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-xs text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
