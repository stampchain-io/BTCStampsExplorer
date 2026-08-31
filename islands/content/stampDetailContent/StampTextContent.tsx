/* ===== STAMP TEXT CONTENT COMPONENT ===== */
import { useEffect, useRef, useState } from "preact/hooks";

/* ===== COMPONENT ===== */
export default function StampTextContent({ src }: { src: string | undefined }) {
  /* ===== STATE MANAGEMENT ===== */
  const [content, setContent] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState("8px");

  /* ===== REFS ===== */
  const containerRef = useRef<HTMLDivElement>(null);

  /* ===== EFFECTS ===== */
  // Responsive font size calculation
  useEffect(() => {
    const updateFontSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const calculatedSize = Math.min(Math.max(containerWidth * 0.04, 8), 48);
        setFontSize(`${calculatedSize}px`);
      }
    };

    updateFontSize();

    // Watch container size changes
    const resizeObserver = new ResizeObserver(updateFontSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Fetch text content
  useEffect(() => {
    if (!src) return;
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

  /* ===== RENDER ===== */
  if (!src) return null;
  if (error) return <div class="text-color-red-400">Error: {error}</div>;

  return (
    <div
      ref={containerRef}
      class="flex items-center justify-center w-full h-full p-2 overflow-hidden bg-gradient-to-br from-color-orange-300 via-color-orange-400 to-color-orange-500 rounded-2xl"
    >
      {/* ===== TEXT CONTENT ===== */}
      <pre
        class="whitespace-pre-wrap break-words max-w-full text-neutral-900 text-center"
        style={{ fontSize }}
      >
        {content}
      </pre>
    </div>
  );
}
