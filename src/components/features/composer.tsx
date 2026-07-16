'use client';
import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreatePost, usePostMedia } from '@/hooks/use-feed';
import { useSessionStore } from '@/stores/session';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { toast } from '@/components/ui/toast';

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

interface PendingImage {
  file: File;
  preview: string;
  publicId?: string; // set once uploaded
  uploading: boolean;
}

export function Composer() {
  const [body, setBody] = useState('');
  const [images, setImages] = useState<PendingImage[]>([]);
  const create = useCreatePost();
  const uploadMedia = usePostMedia();
  const user = useSessionStore((s) => s.user);
  const fileInput = useRef<HTMLInputElement>(null);

  const hasContent = body.trim().length > 0 || images.length > 0;
  const anyUploading = images.some((i) => i.uploading);

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4 - images.length); // max 4 total
    e.target.value = ''; // allow re-picking the same file
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      const entry: PendingImage = { file, preview, uploading: true };
      setImages((prev) => [...prev, entry]);
      const result = await uploadMedia(file);
      setImages((prev) =>
        prev.map((i) =>
          i.preview === preview
            ? { ...i, uploading: false, publicId: result?.publicId }
            : i,
        ),
      );
      if (!result) toast.error('An image failed to upload.');
    }
  };

  const removeImage = (preview: string) =>
    setImages((prev) => prev.filter((i) => i.preview !== preview));

  const post = () => {
    if (!hasContent || anyUploading) return;
    const media = images
      .filter((i) => i.publicId)
      .map((i) => ({ publicId: i.publicId!, type: 'image' as const }));

    create.mutate(
      {
        ...(body.trim() ? { body: body.trim() } : {}),
        ...(media.length ? { media } : {}),
      },
      {
        onSuccess: () => {
          setBody('');
          setImages([]);
        },
        onError: () => toast.error('Could not post. Try again.'),
      },
    );
  };

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <BlobAvatar name={user?.fullName ?? ''} size={40} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's the occasion?"
          rows={body || images.length ? 3 : 1}
          maxLength={2000}
          className="flex-1 resize-none bg-transparent pt-2 text-[15px] outline-none placeholder:text-ink-faint"
        />
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 pl-[52px]">
          {images.map((img) => (
            <div key={img.preview} className="relative aspect-square overflow-hidden rounded-xl">
              <img src={img.preview} alt="" className="size-full object-cover" />
              {img.uploading && (
                <div className="absolute inset-0 grid place-items-center bg-black/40">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
              <button
                onClick={() => removeImage(img.preview)}
                className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between pl-[52px]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={images.length >= 4}
            className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-black/[0.04] disabled:opacity-40"
            aria-label="Add image"
          >
            <ImagePlus size={20} />
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onPickFiles}
          />
          {body && <span className="font-mono text-[12px] text-ink-faint">{body.length}/2000</span>}
        </div>
        {hasContent && (
          <Button onClick={post} loading={create.isPending} disabled={anyUploading} className="h-10 px-5">
            {anyUploading ? 'Uploading…' : 'Post'}
          </Button>
        )}
      </div>
    </div>
  );
}