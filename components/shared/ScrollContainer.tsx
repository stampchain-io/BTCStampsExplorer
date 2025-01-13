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
}

export function ScrollContainer(
  { children, class: className = "" }: ScrollContainerProps,
) {
  return (
    <>
      <div class={`overflow-auto ${className}`}>
        {children}
      </div>
      <script dangerouslySetInnerHTML={{ __html: scrollbarPadding }} />
    </>
  );
}
