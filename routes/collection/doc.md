/**
 * Collection Route Pages
 * ======================
 *
 * Overview
 * --------
 * - `index.tsx` — the Collection landing/overview page. Renders the paginated
 *   "artist" collections gallery (formerly `[overview].tsx`'s artist tab).
 *   Static route matching `/collection` exactly.
 * - `[id].tsx` — the Collection Details page for a single collection,
 *   matching `/collection/:id` (formerly `detail/[id].tsx`).
 *
 * Routing note
 * ------------
 * Fresh only allows one dynamic single-segment route file per directory.
 * This folder previously had both `[overview].tsx` (matching
 * `/collection/artist|posh|recursive`) and a `detail/[id].tsx` in a
 * subfolder to avoid clashing with it. The posh/recursive tabs were
 * removed, so `[overview].tsx` was deleted and `[id].tsx` was moved up
 * into this folder — it's now the only dynamic segment route here, so
 * there's no conflict.
 *
 * Components
 * ----------
 * There's no dedicated `$collection` barrel — collection-related components
 * are grouped by UI element type, like the rest of the codebase, and pulled
 * in via the existing barrels:
 * - CollectionOverviewHeader, CollectionDetailHeader — islands/header/index.ts ($header)
 * - CollectionGallery, CollectionGalleryBanner, CollectionsBanner — islands/section/index.ts ($section)
 * - CollectionContent — islands/content/index.ts ($content)
 * - CollectionCard — components/card/index.ts ($card)
 *
 */
