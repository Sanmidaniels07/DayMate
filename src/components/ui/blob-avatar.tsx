import { useId } from 'react';

const TINTS: Record<string, string> = {
  butter: 'var(--blob-butter)', blush: 'var(--blob-blush)', powder: 'var(--blob-powder)',
  lavender: 'var(--blob-lavender)', sage: 'var(--blob-sage)', peach: 'var(--blob-peach)',
};

/** Shared so anything tinting UI by a user's blob (banners, badges, etc.)
 *  doesn't redeclare the tint→token mapping. */
export function getBlobTintVar(tint?: string | null) {
  return TINTS[tint ?? ''] ?? TINTS.powder;
}

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const BLOB_PATH = 'M50 3 C74 3 97 20 97 48 C97 78 78 97 50 97 C22 97 3 79 3 49 C3 21 25 3 50 3 Z';

interface Props {
  name: string;
  tint?: string | null;
  avatarUrl?: string | null;
  size?: number;
  birthday?: boolean;
}

export function BlobAvatar({ name, tint, avatarUrl, size = 44, birthday }: Props) {
  const clipId = useId();
  const fill = getBlobTintVar(tint); // ← was `TINTS[tint ?? ''] ?? 'var(--blob-powder)'`
  const initials = name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const src = avatarUrl && CLOUD
    ? `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,g_face,w_${size * 2},h_${size * 2}/${avatarUrl}`
    : null;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={name}>
      <defs>
        <clipPath id={clipId}>
          <path d={BLOB_PATH} />
        </clipPath>
      </defs>
      {birthday && (
        <path d={BLOB_PATH} fill="none" stroke="var(--celebrate)" strokeWidth="6" aria-hidden="true" />
      )}
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={fill} />
        {src ? (
          <image
            href={src}
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid slice"
            onError={(e) => { (e.currentTarget as SVGImageElement).style.display = 'none'; }}
          />
        ) : (
          <text x="50" y="50" dominantBaseline="central" textAnchor="middle"
            fontSize="34" fontWeight="600" fill="var(--ink)" opacity="0.55">
            {initials}
          </text>
        )}
      </g>
    </svg>
  );
}