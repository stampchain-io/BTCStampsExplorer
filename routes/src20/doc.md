/**
 * Src20 Route Pages
 * =================
 * 
 * Overview
 * --------
 * The index.tsx contains the Src20 Overview page
 * The [tick].tsx contains the Src20 Details page
 *
 *
 * Components
 * ----------
 * There's no dedicated `$src20` barrel — src20-related components are
 * grouped by UI element type, like the rest of the codebase, and pulled
 * in via the existing barrels:
 * - SRC20OverviewHeader, SRC20DetailHeader — islands/header/index.ts ($header)
 * - SRC20OverviewContent — islands/content/index.ts ($content)
 * - DetailsTableBase — islands/table/index.ts ($table), used on the detail
 *   page to render the HOLDERS / MINTS / TRANSFERS / INFO tables
 *
 */