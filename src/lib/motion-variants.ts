import { Variants } from "framer-motion";

export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
} as const;

export const bentoItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: springTransition },
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
};
