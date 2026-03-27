"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  file_url: string | null;
  file_type: string | null;
  created_at?: string;
};

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("lo-LA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const next = payload.new as Message;
          setMessages((prev) => [...prev, next]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() && !fileInputRef.current?.files?.[0]) return;

    setIsSending(true);
    let fileUrl: string | null = null;
    let fileType: string | null = null;

    const file = fileInputRef.current?.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop() || "bin";
      const path = `chat/${conversationId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(path, file, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage.from("chat-files").getPublicUrl(path);
        fileUrl = data.publicUrl;
        fileType = file.type;
      }
    }

    const content = text.trim() || "ໄຟລ໌ແນບ";
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      file_url: fileUrl,
      file_type: fileType,
      is_read: false,
    });

    await supabase
      .from("conversations")
      .update({ last_message: content, last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    setText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsSending(false);
  }

  return (
    <div className="flex min-h-[70vh] flex-col rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  isMine ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                <p>{message.content}</p>
                {message.file_url ? (
                  <a
                    href={message.file_url}
                    target="_blank"
                    className={`mt-1 block underline ${isMine ? "text-white" : "text-blue-600"}`}
                    rel="noreferrer"
                  >
                    ເບິ່ງໄຟລ໌ແນບ
                  </a>
                ) : null}
                <p className={`mt-1 text-[11px] ${isMine ? "text-orange-100" : "text-gray-500"}`}>
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-xl border border-gray-200 p-2 text-gray-600">
            <Paperclip className="h-4 w-4" />
            <input ref={fileInputRef} type="file" className="hidden" />
          </label>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="ພິມຂໍ້ຄວາມ..."
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
          />
          <button
            type="submit"
            disabled={isSending}
            className="rounded-xl bg-orange-500 p-2 text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
