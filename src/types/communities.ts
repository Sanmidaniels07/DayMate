
export interface Envelope<T, M = unknown> {
  data: T;
  meta: M;
}


export interface CursorMeta {
  nextCursor: string | null;
  hasMore?: boolean;
}

export type JoinMethod = 'AUTO' | 'MANUAL';

export type CommunityType =
  | 'MONTH'       
  | 'ZODIAC'      
  | 'DAY'        
  | 'GENERATION'  
  | (string & {});


export interface Community {
  id: string;
  type: CommunityType;
  name: string;
  slug?: string;
  description?: string | null;
  memberCount: number;      // ⚑ or `_count.members`
  emoji?: string | null;    // ⚑ speculative
  color?: string | null;    // ⚑ speculative
  createdAt?: string;
}

export interface Membership {
  joinMethod: JoinMethod;
  joinedAt: string;         // ⚑ ISO string assumed; present?
}

/** GET /communities/mine — community annotated with how you joined.
 *  ⚑ Assuming membership is NESTED. If the backend flattens it (joinMethod at
 *  top level), switch to `Community & { joinMethod: JoinMethod }`. */
export type MyCommunity = Community & { membership: Membership };

/** GET /communities/{id} — detail; membership is null when not a member
 *  (this part IS stated in the spec — just confirming the object shape). */
export type CommunityDetail = Community & { membership: Membership | null };

/** GET /communities/{id}/members — private profiles already excluded server-side.
 *  ⚑ Must match the user shape PersonRow/BlobAvatar already consume elsewhere. */
export interface CommunityMember {
  id: string;
  displayName: string;      // ⚑ or `name`
  username?: string;
  avatarUrl?: string | null;
  birthday?: string;        // ⚑ maybe just month/day for the birthday context
}