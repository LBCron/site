// Helpers shared by the listing pages (home, blog, tags).
import type { ImageMetadata } from 'astro';
import readingTime from 'reading-time';

// Share images live under public/ so social cards can fetch them by URL, but
// importing them here lets Astro's image pipeline emit resized WebP copies
// for the listing pages instead of the 1200x630 PNGs. Needs
// `imageService: 'compile'` on the Cloudflare adapter (see docs/architecture).
const shareImages = import.meta.glob<{ default: ImageMetadata }>('/public/assets/*/link.png');

export async function shareImage(path?: string): Promise<ImageMetadata | null> {
	if (!path) return null;
	const loader = shareImages[`/public${path}`];
	return loader ? (await loader()).default : null;
}

export function minutesToRead(body?: string): number {
	return Math.max(1, Math.round(readingTime(body ?? '').minutes));
}

export const tagSlug = (tag: string) => tag.toLowerCase().replace(/\s+/g, '-');

// The site-wide "hungovercoders" tag is on every post and says nothing.
export const visibleTags = (tags?: string[]) =>
	(tags ?? []).filter((t) => t.toLowerCase() !== 'hungovercoders');
