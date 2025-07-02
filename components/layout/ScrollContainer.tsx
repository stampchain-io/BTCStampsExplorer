// deno-lint-ignore-file react-no-danger
const scrollbarPadding = `
  (function() {
    const container = document.currentScript.previousElementSibling;
    if (!container) return;

    const checkScrollbar = () => {
      const hasScrollbar = container.scrollHeight > container.clientHeight;
      container.style.paddingRight = hasScrollbar 
        ? (globalThis.innerWidth >= 568 ? '24px' : '18px')
        : '0px';
    };

    checkScrollbar();
    
    const resizeObserver = new ResizeObserver(checkScrollbar);
    resizeObserver.observe(container);
  })();
`;

interface ScrollContainerProps {
  children: preact.ComponentChildren;
  class?: string;
  onScroll?: (e: Event) => void;
}

export function ScrollContainer(
  { children, class: className = "", onScroll }: ScrollContainerProps,
) {
  return (
    <>
      <div class={`overflow-auto ${className}`} onScroll={onScroll}>
        {children}
      </div>
      <script dangerouslySetInnerHTML={{ __html: scrollbarPadding }} />
    </>
  );
}
