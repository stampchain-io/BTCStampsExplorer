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
      // Store pre tag contents to restore later
      const preTags: string[] = [];
      let formatted = html.replace(/<pre[\s\S]*?<\/pre>/g, (match) => {
        preTags.push(match);
        return `###PRE_TAG_${preTags.length - 1}###`;
      });

      // Apply formatting to non-pre content
      formatted = formatted
        .replace(/;/g, ";\n")
        .replace(/</g, "\n<")
        .replace(/>/g, ">\n")
        .replace(/\{/g, " {\n")
        .replace(/\}/g, "\n}\n");

      // Format script tags (excluding pre content)
      if (formatted.includes("<script")) {
        formatted = formatted.replace(
          /(<script.*?>)([\s\S]*?)(<\/script>)/g,
          (_match, openTag, content, closeTag) => {
            const formattedScript = content
              .replace(/([{}\[\]])/g, "$1\n")
              .replace(/;/g, ";\n")
              .replace(/,\s*/g, ",\n")
              .replace(/\) {/g, ") {\n")
              .replace(/\n\n+/g, "\n");

            return `${openTag}\n${formattedScript}\n${closeTag}`;
          },
        );
      }

      // Restore pre tags
      formatted = formatted.replace(
        /###PRE_TAG_(\d+)###/g,
        (_, index) => preTags[index],
      );

      let indent = 0;
      let result = "";

      formatted.split("\n").forEach((line) => {
        line = line.trim();
        if (!line) return;

        if (line.match(/^<\//) || line === "}" || line === "]") {
          indent = Math.max(0, indent - 2);
        }

        const lineIndent = indent;
        result += " ".repeat(lineIndent) + line + "\n";

        if (
          (line.match(/^<[^/]/) && !line.match(/\/>/) &&
            !line.includes("</")) ||
          line.endsWith("{") || line.endsWith("[")
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
        <code className="whitespace-pre-wrap text-xs text-stamp-grey-darkest leading-tight">
          {formattedSrc}
        </code>
      </div>
    </ModalBase>
  );
}
