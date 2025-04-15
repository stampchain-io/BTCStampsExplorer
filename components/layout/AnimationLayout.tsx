import { useState } from "preact/hooks";

const AnimationLayout = (
  { handleClose, children }: {
    handleClose: () => void;
    children: preact.ComponentChildren;
  },
) => {
  const [status, setStatus] = useState<boolean>(false);

  const handleClickOutside = () => {
    setStatus(true);
    setTimeout(() => {
      handleClose();
    }, 500);
  };
  return (
    <>
      <div
        class={`scaleUpDown ${status ? "out" : ""}`}
        id="animation-modal-container"
        onClick={handleClickOutside}
      >
        <div class="animation-modal-background">
          <div class="animation-modal">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnimationLayout;
