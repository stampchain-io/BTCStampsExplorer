/* ===== PAGE SECTIONS ===== */
/* ===== GALLERIES ===== */
export * from "$islands/section/gallery/StampOverviewGallery.tsx";
export { default as StampGallery } from "$islands/section/gallery/StampGallery.tsx";
export * from "$islands/section/gallery/SRC20Gallery.tsx";
export { default as CollectionGallery } from "$islands/section/gallery/CollectionGallery.tsx";
export { default as ArtistGallery } from "$islands/section/gallery/ArtistGallery.tsx";

/* ===== CAROUSEL ===== */
export * from "$components/section/gallery/CarouselHome.tsx";
export { default as CarouselGallery } from "$islands/section/gallery/Carousel.tsx";
export { default as SwiperStyles } from "$islands/section/gallery/SwiperStyles.tsx";

/* ===== BANNER IMAGES ===== */
export * from "$islands/section/gallery/PartnersBanner.tsx";
export { default as TeamBanner } from "$islands/section/gallery/TeamBanner.tsx";
export * from "$components/section/gallery/CollectionsBanner.tsx";

/* ===== RECENT/LATEST ===== */
export * from "$islands/section/gallery/StampSales.tsx";
export { default as StampTransfersGallery } from "$islands/section/gallery/StampTransfers.tsx";
export { default as SRC20DeploysGallery } from "$islands/section/gallery/SRC20Deploys.tsx";
export { default as SRC20MintsGallery } from "$islands/section/gallery/SRC20Mints.tsx";
export { default as SRC20TransfersGallery } from "$islands/section/gallery/SRC20Transfers.tsx";
/* export { default as SRC101RegistersGallery } from "$islands/section/gallery/SRC101Registers.tsx"; */

/* ===== HOW TO ===== */
export * from "$islands/section/howto/StampingHowto.tsx";
export * from "$islands/section/howto/StampTransferHowto.tsx";
export * from "$islands/section/howto/SRC20DeployHowto.tsx";
export * from "$islands/section/howto/SRC20MintHowto.tsx";
export * from "$islands/section/howto/SRC20TransferHowto.tsx";
export * from "$islands/section/howto/SRC101RegisterHowto.tsx";
/* ===== HOW TO BASE TEMPLATES ===== */
export * from "$components/section/howto/data.ts";
export * from "$components/section/howto/ArticleBase.tsx";
export * from "$components/section/howto/ListBase.tsx";
export * from "$components/section/howto/AuthorBase.tsx";
export * from "$components/section/howto/ArticlesOverviewBase.tsx";

/* ===== CTA ===== */
export * from "$islands/section/cta/StampchainContactCta.tsx";
export * from "$islands/section/cta/GetStampingCta.tsx";
export * from "$islands/section/cta/StampPoshCta.tsx";
export * from "$islands/section/cta/RecursiveContactCta.tsx";
/* I have no idea why, but these two files cannot be barrel exported */
/* It breaks the display of the tools */
/* Direct path import in /routes/about/index.tsx instead */
/* export * from "$islands/section/cta/DonateCta.tsx"; */
/* export * from "$islands/section/cta/ContactCta.tsx"; */
