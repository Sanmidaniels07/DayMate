"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, MapPin, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlobAvatar } from "@/components/ui/blob-avatar";
import { Toggle } from "@/components/ui/toggle";
import { useMyProfile, useUpdateProfile } from "@/hooks/use-settings";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

type Form = {
  displayName: string;
  bio: string;
  city: string;
  country: string;
  anniversaryDate: string;
  showAnniversary: boolean;
};

export default function EditProfilePage() {
  const { data, refetch } = useMyProfile();
  const update = useUpdateProfile();
  const { upload, uploading } = useAvatarUpload();
  const router = useRouter();

  
  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/settings");
    }
  };

  const blank: Form = {
    displayName: "", bio: "", city: "", country: "",
    anniversaryDate: "", showAnniversary: true,
  };
  const [form, setForm] = useState<Form>(blank);
  const [original, setOriginal] = useState<Form>(blank);
  const [saved, setSaved] = useState(false);

  const qc = useQueryClient();

  useEffect(() => {
    if (data) {
      const d = data.data;
      const anniversaryDate =
        d.anniversaryMonth && d.anniversaryDay
          ? `2000-${String(d.anniversaryMonth).padStart(2, "0")}-${String(d.anniversaryDay).padStart(2, "0")}`
          : "";
      const next: Form = {
        displayName: d.displayName,
        bio: d.bio ?? "",
        city: d.city ?? "",
        country: d.country ?? "",
        anniversaryDate,
        showAnniversary: d.showAnniversary ?? true,
      };
      setForm(next);
      setOriginal(next);
    }
  }, [data]);

  const p = data?.data;

  const isDirty = useMemo(
    () => Object.keys(form).some((k) => form[k as keyof Form] !== original[k as keyof Form]),
    [form, original],
  );

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const publicId = await upload(file);
  if (publicId) {
    toast.success("Profile photo updated");
    await refetch();
  }
};

  const save = () => {
    const { anniversaryDate, ...rest } = form;
    update.mutate(
      {
        ...rest,
        anniversaryDate: anniversaryDate ? anniversaryDate : null,
      },
      {
        onSuccess: () => {
          setOriginal(form);
          setSaved(true);
          toast.success("Profile updated");
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  const set =
    (key: keyof Form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="mx-auto flex min-h-screen flex-col pb-28 rounded-lg shadow-lg">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--surface)]/80 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label="Go back"
            className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-[var(--surface-raised)] active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
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

        {/* Anniversary */}
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            <Heart size={12} /> Anniversary
          </h2>
          <p className="text-[13px] text-ink-soft">
            Optional — meet other couples who share your day. Only the month and day are used, never the year.
          </p>
          <Input
            label="Wedding anniversary"
            type="date"
            value={form.anniversaryDate}
            onChange={set("anniversaryDate")}
          />
          {form.anniversaryDate && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, anniversaryDate: "" }))}
              className="self-start text-[13px] font-medium text-danger"
            >
              Remove anniversary
            </button>
          )}
          <div className="rounded-2xl bg-[var(--surface-raised)] px-4">
            <Toggle
              checked={form.showAnniversary}
              onChange={(v) => setForm((f) => ({ ...f, showAnniversary: v }))}
              label="Show on my profile"
              description="Others can see your anniversary date."
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

      {/* Sticky bottom save bar */}
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