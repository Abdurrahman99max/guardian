import type { Transition, Variants } from 'motion/react';

const transition: Transition = {
  duration: 0.22,
  ease: [0.2, 0, 0, 1],
};

const emphasizedTransition: Transition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1],
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition },
  exit: { opacity: 0, transition },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: emphasizedTransition },
  exit: { opacity: 0, y: 6, transition },
};

export const cardReveal: Variants = {
  hidden: { opacity: 0, scale: 0.995, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: emphasizedTransition },
};

export const dropdownOpen: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition },
  exit: { opacity: 0, scale: 0.98, y: -4, transition },
};

export const modalOpen: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: emphasizedTransition },
  exit: { opacity: 0, scale: 0.98, y: 8, transition },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: emphasizedTransition },
  exit: { opacity: 0, y: -4, transition },
};
