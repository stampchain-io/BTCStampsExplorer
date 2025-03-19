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

      {/* Icons */}
      <link rel="icon" type="image/jpeg" href="/img/icon.jpg" sizes="any" />
      <link rel="apple-touch-icon" href="/img/icon.jpg" />
      <link rel="canonical" href="https://stampchain.io" />

      {/* OpenGraph tags */}
      <meta property="og:title" content="Stampchain.io" key="og-title" />
      <meta
        property="og:description"
        content={description}
        key="og-description"
      />
      <meta property="og:image" content={image} key="og-image" />
      <meta property="og:image:type" content={getImageType(image)} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:type" content="website" key="og-type" />
      <meta property="og:url" content="https://stampchain.io" key="og-url" />
      <meta property="og:locale" content="en_US" key="og-locale" />

      {/* Twitter Card tags */}
      <meta
        name="twitter:card"
        content="summary_large_image"
        key="twitter-card"
      />
      <meta name="twitter:title" content="stampchain.io" key="twitter-title" />
      <meta name="twitter:image" content={image} key="twitter-image" />
      <meta
        name="twitter:description"
        content={description}
        key="twitter-description"
      />
    </>
  );
}

// Helper function to set the correct MIME type for OpenGraph
function getImageType(image: string) {
  if (image.endsWith(".jpg") || image.endsWith(".jpeg")) return "image/jpeg";
  if (image.endsWith(".png")) return "image/png";
  if (image.endsWith(".gif")) return "image/gif";
  if (image.endsWith(".svg")) return "image/svg+xml";
  return "image/png"; // Default
}
