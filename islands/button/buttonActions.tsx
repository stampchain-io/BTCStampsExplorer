import { useState } from "preact/hooks";

export function useButtonActions() {
  const [isActive, setIsActive] = useState(false);

  const activeHandlers = {
    onMouseDown: () => setIsActive(true),
    onMouseUp: () => setIsActive(false),
    onMouseLeave: () => setIsActive(false),
  };

  return {
    isActive,
    activeHandlers,
  };
}
