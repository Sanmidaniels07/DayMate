import type { Community } from '@/hooks/use-communities';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function communityGlyph(c: Community): { emoji: string; sub: string } {
  switch (c.type) {
    case 'BIRTHDAY':
      return { emoji: '🎂', sub: c.month && c.day ? `${MONTHS[c.month - 1]} ${c.day}` : 'Birthday twins' };
    case 'BIRTH_MONTH':
      return { emoji: '📅', sub: c.month ? `${MONTHS[c.month - 1]} babies` : 'Same month' };
    case 'AGE_BRACKET':
      return { emoji: '✨', sub: c.bracket ?? 'Same era' };
    default:
      return { emoji: '👥', sub: '' };
  }
}