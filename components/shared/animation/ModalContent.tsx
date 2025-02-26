/** @jsx h */
import { FunctionalComponent } from "preact";
import { motion } from "framer-motion";
import ModalBackdrop from "$components/shared/animation/ModalBackdrop.tsx";

const dropIn = {
  hidden: { y: "-100vh", opacity: 0 },
  visible: {
    y: "0",
    opacity: 1,
    transition: { duration: 0.1, type: "spring", damping: 25, stiffness: 500 },
  },
  exit: { y: "100vh", opacity: 0 },
};

interface ModalProps {
  handleOpen: () => void;
  handleClose: () => void;
  text?: string;
}

const ModalContent: FunctionalComponent<ModalProps> = (
  { handleClose },
) => {
  return (
    <ModalBackdrop onClick={handleClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="modal orange-gradient"
        variants={dropIn}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <p>This is animation modal testing</p>
        <button onClick={handleClose}>Close</button>
      </motion.div>
    </ModalBackdrop>
  );
};

export default ModalContent;
