"use client";
import { useRef, useState } from "react";

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecorder.current = rec;
      chunks.current = [];
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = chunks.current.length
          ? new Blob(chunks.current, { type: "audio/webm" })
          : null;
        resolveRef.current?.(blob);
      };
      rec.start(100);
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setRecording(false);
    }
  }

  /** Stop and get the recording. Returns null if cancelled. */
  function stop(): Promise<{ blob: Blob | null; duration: number }> {
    return new Promise((resolve) => {
      if (
        !mediaRecorder.current ||
        mediaRecorder.current.state === "inactive"
      ) {
        resolve({ blob: null, duration: 0 });
        return;
      }
      const duration = seconds;
      resolveRef.current = (blob) => resolve({ blob, duration });
      mediaRecorder.current.stop();
      if (timer.current) clearInterval(timer.current);
      setRecording(false);
    });
  }

  function cancel() {
    chunks.current = [];
    resolveRef.current = () => {}; // swallow the result
    if (mediaRecorder.current?.state !== "inactive")
      mediaRecorder.current?.stop();
    if (timer.current) clearInterval(timer.current);
    setRecording(false);
    setSeconds(0);
  }

  return { recording, seconds, start, stop, cancel };
}
