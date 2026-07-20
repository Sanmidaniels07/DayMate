"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSessionStore } from "@/stores/session";
import { mergeMessage, markMessageFailed, type Message } from "./use-chat";

type Kind = "image" | "voice_note" | "audio" | "video";
const KIND_TO_TYPE: Record<Kind, string> = {
  image: "IMAGE", voice_note: "VOICE_NOTE", audio: "AUDIO", video: "VIDEO",
};

export function useChatMedia(conversationId: string) {
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();
  const meId = useSessionStore((s) => s.user?.id);

  async function sendMedia(file: File | Blob, kind: Kind, durationSec?: number): Promise<boolean> {
    setUploading(true);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
   
    const previewUrl = URL.createObjectURL(file);

    mergeMessage(qc, conversationId, {
      id: tempId,
      conversationId,
      type: KIND_TO_TYPE[kind],
      body: null,
      mediaUrl: previewUrl,
      senderId: meId,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      sender: { profile: null },
      pending: true,
    });

    try {
      const { data: sig } = await api<{ data: {
        signature: string; timestamp: number; apiKey: string; folder: string;
        public_id: string; transformation?: string; uploadUrl: string;
      } }>(`/chat/conversations/${conversationId}/media/sign?kind=${kind}`, { method: "POST" });

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      fd.append("public_id", sig.public_id);
      if (sig.transformation) fd.append("transformation", sig.transformation);

      const res = await fetch(sig.uploadUrl, { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const cloud = await res.json();

      const finalDuration = durationSec ?? (cloud.duration ? Math.round(cloud.duration) : undefined);

      const { data: message } = await api<{ data: Message }>(
        `/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            type: KIND_TO_TYPE[kind],
            mediaUrl: cloud.public_id,
            mediaSize: file.size,
            ...(finalDuration ? { mediaDuration: finalDuration } : {}),
          }),
        },
      );

      mergeMessage(qc, conversationId, message, tempId);
      qc.invalidateQueries({ queryKey: ['conversations'] });

      return true;
    } catch (err) {
      console.error("media upload/send failed:", err);
      markMessageFailed(qc, conversationId, tempId);
      return false;
    } finally {
      setUploading(false);
      setTimeout(() => URL.revokeObjectURL(previewUrl), 5000);
    }
  }

  return { sendMedia, uploading };
}