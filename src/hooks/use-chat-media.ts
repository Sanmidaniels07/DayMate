"use client";
import { useState } from "react";
import { api } from "@/lib/api";

type Kind = "image" | "voice_note" | "audio" | "video";
const KIND_TO_TYPE: Record<Kind, string> = {
  image: "IMAGE",
  voice_note: "VOICE_NOTE",
  audio: "AUDIO",
  video: "VIDEO",
};

export function useChatMedia(conversationId: string) {
  const [uploading, setUploading] = useState(false);

  async function sendMedia(
    file: File | Blob,
    kind: Kind,
    durationSec?: number,
  ): Promise<boolean> {
    setUploading(true);
    try {
      const { data: sig } = await api<{
        data: {
          signature: string;
          timestamp: number;
          apiKey: string;
          folder: string;
          public_id: string;
          transformation?: string;
          uploadUrl: string;
        };
      }>(`/chat/conversations/${conversationId}/media/sign?kind=${kind}`, {
        method: "POST",
      });

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("signature", sig.signature);
      fd.append("folder", sig.folder);
      fd.append("public_id", sig.public_id);
      if (sig.transformation) fd.append("transformation", sig.transformation);

      const res = await fetch(sig.uploadUrl, { method: "POST", body: fd });
      if (!res.ok) return false;
      const cloud = await res.json();

      const finalDuration =
        durationSec ??
        (cloud.duration ? Math.round(cloud.duration) : undefined);

      await api(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          type: KIND_TO_TYPE[kind],
          mediaUrl: cloud.public_id,
          mediaSize: file instanceof File ? file.size : file.size,
          ...(finalDuration ? { mediaDuration: finalDuration } : {}),
        }),
      });
      return true;
    } catch (err) {
      console.error("media upload/send failed:", err);
      return false;
    } finally {
      setUploading(false);
    }
  }

  return { sendMedia, uploading };
}
