/** @jsx h */
/** @jsxFrag Fragment */
import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/hooks";

interface TextContentIslandProps {
  src: string;
}

export default function TextContentIsland({ src }: TextContentIslandProps) {
  const [content, setContent] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(src)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => setContent(text))
      .catch((e) => setError(`Error loading content: ${e.message}`));
  }, [src]);

  if (error) {
    return <div class="text-red-500">Error: {error}</div>;
  }

  return (
    <div class="w-full h-full overflow-auto p-4 text-sm !text-gray-500 flex items-center justify-center">
      <pre class="whitespace-pre-wrap break-words max-w-full">{content}</pre>
    </div>
  );
}
