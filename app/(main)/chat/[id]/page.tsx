import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ChatRoom } from "@/components/ChatRoom";

type Conversation = {
  id: string;
  participant_1: string;
  participant_2: string;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  file_type: string | null;
  created_at: string;
};

export default async function ChatDetailPage({
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

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, participant_1, participant_2")
    .eq("id", id)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .maybeSingle<Conversation>();

  if (!conversation) redirect("/chat");

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, file_url, file_type, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .eq("is_read", false);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">ຫ້ອງແຊດ</h1>
      <ChatRoom
        conversationId={id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
      />
    </main>
  );
}
