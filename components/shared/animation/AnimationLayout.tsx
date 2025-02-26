import { AnimatePresence } from "framer-motion";
import ModalContent from "$components/shared/animation/ModalContent.tsx";

interface AnimationLayoutPropTypes {
  open: boolean;
  handleOpen: () => void;
  handleClose: () => void;
}

const AnimationLayout = (
  { open, handleOpen, handleClose }: AnimationLayoutPropTypes,
) => {
  return (
    <>
      <AnimatePresence
        // Disable any initial animations on children that
        // are present when the component is first rendered
        initial={false}
        // Only render one component at a time.
        // The exiting component will finish its exit
        // animation before entering component is rendered
        exitBeforeEnter={true}
        // Fires when all exiting nodes have completed animating out
        onExitComplete={() => null}
      >
        {open && (
          <ModalContent handleOpen={handleOpen} handleClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
};

export default AnimationLayout;
