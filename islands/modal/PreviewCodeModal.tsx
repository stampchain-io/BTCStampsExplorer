/* ===== PREVIEW CODE MODAL COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { ModalBase } from "$layout";
import { closeModal } from "$islands/modal/states.ts";
import { logger } from "$lib/utils/logger.ts";

/* ===== TYPES ===== */
interface PreviewCodeModalProps {
  src: string;
}

/* ===== COMPONENT ===== */
export default function PreviewCodeModal({ src }: PreviewCodeModalProps) {
  /* ===== STATE ===== */
  const [formattedSrc, setFormattedSrc] = useState("");

  /* ===== EFFECTS ===== */
  // Effect to format the source code
  useEffect(() => {
    setFormattedSrc(formatHtmlSource(src));
  }, [src]);

  /* ===== HELPER FUNCTIONS ===== */
  function formatHtmlSource(html: string): string {
    if (!html || typeof html !== "string") {
      return "No content available";
    }

    try {
      // Better HTML formatting approach
      const formatted = html
        .replace(/></g, ">\n<") // Add line breaks between tags
        .replace(/(<style[^>]*>)/gi, "$1\n") // Add line break after opening <style> tag
        .replace(/(<script[^>]*>)/gi, "$1\n") // Add line break after opening <script> tag
        .replace(/\{/g, " {\n") // Format CSS opening braces
        .replace(/\}/g, "\n}\n") // Format CSS closing braces
        .replace(/;/g, ";\n"); // Format CSS properties

      let indent = 0;
      let result = "";

      formatted.split("\n").forEach((line) => {
        line = line.trim();
        if (!line) return;

        // Detect different types of lines
        const isClosingTag = line.match(/^<\/\w+>$/);
        const isOpeningTag = line.match(/^<\w+[^>]*>$/) && !line.match(/\/>$/);
        const isSelfClosingTag = line.match(/\/>$/);
        const isDoctype = line.match(/^<!DOCTYPE/i);
        const isComment = line.match(/^<!--/) || line.match(/-->$/);
        const isCSSClosing = line === "}";
        const isCSSOpening = line.endsWith("{");

        // Decrease indent for closing elements BEFORE applying
        if (isClosingTag || isCSSClosing) {
          indent = Math.max(0, indent - 2);
        }

        // Apply indentation
        result += " ".repeat(indent) + line + "\n";

        // Increase indent for opening elements AFTER applying
        if (
          (isOpeningTag && !isSelfClosingTag && !isDoctype && !isComment) ||
          isCSSOpening
        ) {
          indent += 2;
        }
      });

      return result.trim();
    } catch (_error) {
      return "Error formatting content";
    }
  }

  /* ===== RENDER ===== */
  return (
    <ModalBase
      onClose={() => {
        logger.debug("ui", {
          message: "Preview code modal closing",
          component: "PreviewCodeModal",
        });
        closeModal();
      }}
      title=""
      hideHeader
      className="w-[calc(100vw-48px)] h-[calc(100vh-48px)] mobileLg:w-[calc(100vw-96px)] mobileLg:h-[calc(100vh-96px)] max-w-[800px]"
      contentClassName="h-full bg-[#FAFAFA] rounded-md overflow-auto scrollbar-grey"
    >
      {/* ===== CODE DISPLAY ===== */}
      <div className="flex flex-col w-full h-full p-6 mobileMd:p-9">
        <code className="whitespace-pre-wrap text-xs text-stamp-grey-darkest leading-tight pb-6 mobileMd:pb-9">
          {formattedSrc}
        </code>
      </div>
    </ModalBase>
  );
}
