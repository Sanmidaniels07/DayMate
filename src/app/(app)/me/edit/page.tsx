'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useMyProfile, useUpdateProfile } from '@/hooks/use-settings';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';

export default function EditProfilePage() {
  const { data } = useMyProfile();
  const update = useUpdateProfile();
  const { upload, uploading } = useAvatarUpload();
  const router = useRouter();
  const [form, setForm] = useState({ displayName: '', bio: '', city: '', country: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm({
      displayName: data.data.displayName, bio: data.data.bio ?? '',
      city: data.data.city ?? '', country: data.data.country ?? '',
    });
  }, [data]);

  const p = data?.data;
  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await upload(file);
  };
  const save = () => {
    update.mutate(form, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link href="/settings"><ArrowLeft size={22} /></Link>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Edit profile</h1>
      </div>

      <div className="card flex flex-col items-center gap-3 p-6">
        <div className="relative">
          <BlobAvatar name={p?.displayName ?? ''} tint={p?.blobTint} avatarUrl={p?.avatarUrl} size={88} />
          {uploading && (
            <div className="absolute inset-0 grid place-items-center rounded-full bg-black/30">
              <span className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
        <label className="cursor-pointer text-[14px] font-semibold text-accent">
          Change photo
          <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
        </label>
        <p className="text-[13px] text-ink-faint">@{p?.username}</p>
      </div>

      <div className="card flex flex-col gap-4 p-6">
        <Input label="Display name" value={form.displayName} maxLength={40}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-ink-soft">Bio</label>
          <textarea value={form.bio} maxLength={500} rows={3}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="resize-none rounded-xl border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 py-3 text-[15px] outline-none focus:border-accent" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        <Button onClick={save} loading={update.isPending} className="mt-2 w-full">
          {saved ? 'Saved ✓' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}