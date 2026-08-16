# Plan — next steps

Working list of upcoming work. Ordered loosely by area, not priority.

## Editor / content

- [x] **Tables in the block editor** — add a `table` block to `BlockEditor` and a matching renderer in `PostBody`. Needs a mobile story (real table on desktop, reflow to stacked cards under ~640px).
- [x] **Taller single images** — single (non-column) image blocks render too short. Check the Bobbi Brown dupe post for a real example and adjust the aspect ratio in `PostBody`.
- [x] **Published-at date** — let the author set the publish date explicitly in `PostForm`, rather than it being derived only from the visibility choice.

## Public site

- [ ] **About page** — needs a significant rewrite/redesign, not a tweak.
- [x] **Filter by categories button** — reposition on the all-posts page (`BlogIndex`).
- [x] **White body background** — make the body background white across the app.
- [x] **Remove "My Favourite Products" lists** — drop the product scroller sections from the makeup / skincare / lifestyle category pages.
- [x] **Categories submenu** — add a nav submenu listing all categories (Glamour-style), then remove the categories block from the homepage.
- [x] **Headings on blog post** — h2 needs to be made slightly larger to distinguish itself from h3
- [x] **Blog page pagination** — Blog pages need to be paginated via URL also? so when a user navigates back it saves their state maybe?

## Newsletter

- [ ] **Set up the newsletter for real** — wire the signup forms to an actual provider, and add newsletter management to the admin.

## Integrations

- [ ] **Analytics** — add PostHog (or equivalent) tracking.
- [ ] **Skimlinks** — add the Skimlinks setup to the app.

## Design reference

Keep using [glamourmagazine.co.uk](https://www.glamourmagazine.co.uk/) as the visual reference for layout and typography decisions.
