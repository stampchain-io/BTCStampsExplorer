/**
 * Stamp Route Pages
 * =================
 *
 * Overview
 * --------
 * The index.tsx file no longer renders the Stamp Overview page. That page
 * was superseded by Explorer, so index.tsx now just 301-redirects legacy
 * /stamp traffic (and its query string) to /explorer.
 * The [id].tsx file contains the Stamp Details page (/stamp/[id]) and is
 * still the primary destination for individual stamp links across the app.
 *
 * Routing note
 * ------------
 * `art.tsx` (/stamp/art) and `posh.tsx` (/stamp/posh) — the old per-type
 * stamp overview tabs — were removed along with the rest of the Stamp
 * Overview page. Their type filtering now lives on /explorer via the
 * `type` query param (see FrontendStampType in
 * lib/constants/stampConstants.ts and islands/filter/FilterOptionsStamps.tsx).
 *
 * [id].tsx
 * --------
 * Fetches the stamp (with market data), its holders, up to 12 recent
 * stamps/SRC-721s for the "LATEST STAMPS" gallery, and — best-effort —
 * the collection the stamp belongs to (via CollectionRepository). For
 * STAMP/SRC-721 idents it also fetches open dispensers to surface the
 * lowest listed price. Renders StampImage/StampInfo ($content), a
 * DetailsTableBase ($table) for non-SRC-20 stamps (holders/dispensers/
 * sales/transfers), and a StampGallery ($section) of related stamps.
 * Also builds the page's OG/Twitter meta tags and Stamp JSON-LD.
 *
 */
