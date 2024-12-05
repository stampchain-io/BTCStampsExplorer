interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
}

export function MetaTags({
  title = "Bitcoin Stamps",
  description = "Unprunable UTXO Art, Because Sats Don't Exist",
  image = "/img/stamp.jpg",
}: MetaTagsProps) {
  // Add preconnect hints for external resources
  return (
    <>
      {/* Performance optimizations */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="preload" href="/styles.css" as="style" />
      <link rel="preload" href="/img/icon.jpg" as="image" />

      {/* Meta tags */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <meta
        name="description"
        content={description}
      />
      <meta
        name="keywords"
        content="Bitcoin, Stamps, UTXO, Art, Blockchain"
      />
      <meta name="author" content="Stampchain.io" />

      {/* Stylesheets */}
      <link rel="stylesheet" href="/carousel.css" />
      <link rel="stylesheet" href="/styles.css" />
      <link rel="stylesheet" href="/gradients.css" />
      <link
        rel="stylesheet"
        href="https://esm.sh/swiper@11.1.14/swiper-bundle.min.css"
      />

      {/* Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Micro+5&display=swap"
        rel="stylesheet"
      />

      {/* Icons */}
      <link rel="icon" type="image/png" href="/img/icon.jpg" />
      <link rel="icon" type="image/x-icon" href="/img/icon.jpg" />
      <link rel="apple-touch-icon" href="/img/icon.jpg" />
      <link rel="canonical" href="https://stampchain.io" />

      {/* OpenGraph tags */}
      <meta property="og:title" content="Stampchain.io" />
      <meta
        property="og:description"
        content={description}
      />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://stampchain.io" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="stampchain.io" />
      <meta name="twitter:image" content={image} />
      <meta
        name="twitter:description"
        content={description}
      />
    </>
  );
}
