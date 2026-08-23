/**
 * Stamp Route Pages
 * =================
 *
 * Overview
 * --------
 * The index.tsx file no longer renders the Stamp Overview page. That page
 * was superseded by Marketplace, so index.tsx now just 301-redirects legacy
 * /stamp traffic to /explorer (preserving any query string).
 * The [id].tsx file contains the Stamp Details page (/stamp/[id]) and is
 * still the primary destination for individual stamp links across the app.
 *
 */
