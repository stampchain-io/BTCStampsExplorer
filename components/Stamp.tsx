import { StampRow } from "globals";
import { mimeTypesArray } from "utils/util.ts";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";

export const Stamp = (
  { stamp, className }: { stamp: StampRow; className: string },
) => {
  const getStampSrc = () => {
    if (!stamp.stamp_url) return "/content/not-available.png";

    const urlParts = stamp.stamp_url.split("/");
    const filenameParts = urlParts[urlParts.length - 1].split(".");
    const txHash = filenameParts[0];
    const suffix = filenameParts[1];

    if (!mimeTypesArray.includes(stamp.stamp_mimetype || "")) {
      return "/content/not-available.png";
    }

    return `/content/${txHash}.${suffix}`;
  };

  const src = getStampSrc();

  if (src === "/content/not-available.png") {
    return (
      <div className="stamp-container">
        <img
          width="100%"
          loading="lazy"
          className={`mx-10 md:mx-0 max-w-none object-contain rounded-lg ${className} pixelart stamp-image`}
          src={src}
          alt="Not Available"
        />
      </div>
    );
  }

  if (stamp.stamp_mimetype === "text/html") {
    return (
      <iframe
        width="100%"
        height="100%"
        scrolling="no"
        className={`${className} aspect-square rounded-lg`}
        sandbox="allow-scripts allow-same-origin"
        src={src}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = stamp.stamp_url;
        }}
        title="Stamp"
      />
    );
  }

  if (stamp.stamp_mimetype === "text/plain") {
    return <TextContentIsland src={src} />;
  }

  return (
    <div className="stamp-container">
      <img
        width="100%"
        loading="lazy"
        className={`mx-10 md:mx-0 max-w-none object-contain rounded-lg ${className} pixelart stamp-image`}
        src={src}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/content/not-available.png";
        }}
        alt="Stamp"
      />
    </div>
  );
};

export default Stamp;
