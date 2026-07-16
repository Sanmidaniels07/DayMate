"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlobAvatar } from "@/components/ui/blob-avatar";
import { useMyProfile, useUpdateProfile } from "@/hooks/use-settings";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";

type Form = { displayName: string; bio: string; city: string; country: string };

export default function EditProfilePage() {
  const { data } = useMyProfile();
  const update = useUpdateProfile();
  const { upload, uploading } = useAvatarUpload();
  const router = useRouter();

  const [form, setForm] = useState<Form>({
    displayName: "",
    bio: "",
    city: "",
    country: "",
  });
  const [original, setOriginal] = useState<Form>({
    displayName: "",
    bio: "",
    city: "",
    country: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      const next = {
        displayName: data.data.displayName,
        bio: data.data.bio ?? "",
        city: data.data.city ?? "",
        country: data.data.country ?? "",
      };
      setForm(next);
      setOriginal(next);
    }
  }, [data]);

  const p = data?.data;

  const isDirty = useMemo(
    () =>
      Object.keys(form).some(
        (k) => form[k as keyof Form] !== original[k as keyof Form],
      ),
    [form, original],
  );

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await upload(file);
  };

  const save = () => {
    update.mutate(form, {
      onSuccess: () => {
        setOriginal(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    });
  };

  const set =
    (key: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto flex min-h-screen  flex-col pb-28 rounded-lg shadow-lg ">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--surface)]/80 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-[var(--surface-raised)] active:scale-95"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-display text-[17px] font-semibold tracking-tight">
            Edit profile
          </h1>
        </div>

        <button
          onClick={save}
          disabled={!isDirty || update.isPending}
          className="flex h-8 items-center gap-1.5 rounded-full bg-accent px-4 text-[13px] font-semibold text-white transition-all duration-200 disabled:pointer-events-none disabled:opacity-0"
        >
          {update.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : null}
          {update.isPending ? "Saving" : saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="flex flex-col gap-8 px-4 pt-6">
        {/* Photo */}
        <section className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="rounded-full ring-4 ring-[var(--surface-raised)] transition-transform duration-200 active:scale-[0.97]">
              <BlobAvatar
                name={p?.displayName ?? ""}
                tint={p?.blobTint}
                avatarUrl={p?.avatarUrl}
                size={104}
              />
            </div>

            {uploading && (
              <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40 backdrop-blur-[1px]">
                <span className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}

            <label className="absolute bottom-0 right-0 grid size-9 cursor-pointer place-items-center rounded-full bg-accent text-white shadow-lg ring-4 ring-[var(--surface)] transition-transform hover:scale-105 active:scale-95">
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatar}
              />
            </label>
          </div>

          <p className="text-[13px] font-medium text-ink-faint">
            @{p?.username}
          </p>
        </section>

        {/* Basic info */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            Basic info
          </h2>

          <div className="flex flex-col gap-1.5">
            <Input
              label="Display name"
              value={form.displayName}
              maxLength={40}
              onChange={set("displayName")}
              hint={`${form.displayName.length}/40`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-ink-soft">
                Bio
              </label>
              <span className="text-[11px] text-ink-faint">
                {form.bio.length}/500
              </span>
            </div>
            <textarea
              value={form.bio}
              maxLength={500}
              rows={4}
              placeholder="Tell people a little about yourself"
              onChange={set("bio")}
              className="resize-none rounded-2xl border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent"
            />
          </div>
        </section>

        <div className="h-px bg-[var(--hairline)]" />

        {/* Location */}
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            <MapPin size={12} /> Location
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={set("city")} />
            <Input
              label="Country"
              value={form.country}
              onChange={set("country")}
            />
          </div>
        </section>
      </div>

      {/* Sticky bottom save bar — mobile-friendly, only when there's something to save */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-[var(--hairline)] bg-[var(--surface)]/90 px-4 py-3 backdrop-blur-md transition-transform duration-300 ${
          isDirty ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-lg">
          <Button onClick={save} loading={update.isPending} className="w-full">
            {saved ? "Saved ✓" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
