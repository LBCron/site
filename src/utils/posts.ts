// Helpers shared by the listing pages (home, blog, tags).
import readingTime from 'reading-time';

export function minutesToRead(body?: string): number {
	return Math.max(1, Math.round(readingTime(body ?? '').minutes));
}

export const tagSlug = (tag: string) => tag.toLowerCase().replace(/\s+/g, '-');

// The site-wide "hungovercoders" tag is on every post and says nothing.
export const visibleTags = (tags?: string[]) =>
	(tags ?? []).filter((t) => t.toLowerCase() !== 'hungovercoders');
