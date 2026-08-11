// Cloudflare Images delivery URLs. Lives on its own because both halves of the
// app build them: the admin (via lib/media.ts, which re-exports this) and the
// public read model (lib/public/posts.ts). Importing it has no side effects and
// pulls in no Supabase client, so a server component can use it freely.
//
// The account hash is public and non-secret. Delivery is
// imagedelivery.net/{hash}/{externalId}/{variant}, where the variant must be a
// *named* variant defined in the Cloudflare dashboard — keep "flexible
// variants" OFF so nothing else resolves.

const CF_HASH = process.env.NEXT_PUBLIC_CF_IMAGES_HASH;

export function cfImageUrl(externalId: string, variant = "public"): string {
	return `https://imagedelivery.net/${CF_HASH}/${externalId}/${variant}`;
}
