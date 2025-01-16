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
  return (
    <>
      {/* Essential meta tags */}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="Bitcoin, Stamps, UTXO, Art, Blockchain" />
      <meta name="author" content="Stampchain.io" />

      {/* Stylesheets */}
      <link rel="stylesheet" href="/carousel.css" />
      <link rel="stylesheet" href="/gradients.css" />

      {/* Icons */}
      <link rel="icon" type="image/jpeg" href="/img/icon.jpg" sizes="any" />
      <link rel="apple-touch-icon" href="/img/icon.jpg" />
      <link rel="canonical" href="https://stampchain.io" />

      {/* OpenGraph tags */}
      <meta property="og:title" content="Stampchain.io" />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://stampchain.io" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="stampchain.io" />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:description" content={description} />
    </>
  );
}
