/* ===== STAMP TEXT CONTENT COMPONENT ===== */
import { useEffect, useRef, useState } from "preact/hooks";

/* ===== COMPONENT ===== */
export default function TextContentIsland({ src }: { src: string }) {
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
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full overflow-auto bg-[#F7931A] rounded"
    >
      {/* ===== TEXT CONTENT ===== */}
      <pre
        className="whitespace-pre-wrap break-words max-w-full text-black text-center"
        style={{ fontSize }}
      >
        {content}
      </pre>
    </div>
  );
}
