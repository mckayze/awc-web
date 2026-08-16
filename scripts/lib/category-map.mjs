// WordPress category slug → our category slug(s). One WP category can fan
// out to several of ours (e.g. the old site's combined "Body & hair care"
// splits into two here); anything not listed is reported rather than
// silently dropped or auto-created (see `report` in wp-import.mjs).
export const CATEGORY_MAP = {
	skincare: ["skincare"],
	makeup: ["makeup"],
	// Compound WP categories mean both halves — "skincare-product-reviews" is
	// a skincare post AND a product review, so it gets both of ours. Harmless
	// if a post is already separately tagged "skincare" too: resolveCategoryIds
	// dedupes via a Set before writing post_categories.
	"skincare-product-reviews": ["skincare", "product-reviews"],
	"makeup-product-reviews": ["makeup", "product-reviews"],
	"body-nails-hair": ["body-care", "hair-care"],
	"hair-care": ["hair-care"],
	"body-care": ["body-care"],
	lifestyle: ["lifestyle"],
	"skincare-recommendations": ["skincare", "recommendations"],
	"makeup-recommendations": ["makeup", "recommendations"],
	"battle-of-the-brands": ["battle-of-the-brands"],
	"skincare-device-reviews": ["skincare", "device-reviews"],
	"skincare-brand-reviews": ["skincare", "brand-reviews"],
	"makeup-brand-reviews": ["makeup", "brand-reviews"],
	"skincare-tips": ["skincare", "tips"],
	"makeup-tips": ["makeup", "tips"],
	"lookbook-makeup": ["makeup", "lookbook"],
	"makeup-dupes": ["makeup", "dupes"],
	"skincare-dupes": ["skincare", "dupes"],
	uncategorised: [],
};
