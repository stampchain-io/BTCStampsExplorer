/**
 * Collection Route Pages
 * ======================
 * 
 * Overview
 * --------
 * The index.tsx contains the Collection Landing page
 * The [overview].tsx contains the Collection Overview page for: Posh, recursive and artists
 * The detail folder contains the [id].tsx Collection Details page
 * - I attempted having the [id].tsx file in the route folder, but it overrules the [overview].tsx file
 *   and posh, recursive and artists pages display in the [id].tsx file instead
 *   I tried several approaches, but couldn't properly redirect to or use the [overview].tsx file
 *
 *
 * Barrel files
 * ------------
 * The barrel file for exporting all collection-related islands components is located in:
 * /islands/collection/index.ts
 * All collection related files can be imported using:
 * import { CollectionXxxx, CollectionYyyy } from "$collection";
 *
 */