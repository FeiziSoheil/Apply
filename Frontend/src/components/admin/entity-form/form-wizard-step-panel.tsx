"use client";

import { useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

/** RTL-aware step slide: forward enters from inline-end (left) */
const STEP_SLIDE_VARIANTS: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -36 : 36,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 36 : -36,
  }),
};

const STEP_TRANSITION = {
  duration: 0.38,
  ease: [0.22, 1, 0.36, 1] as const,
};

/** Animated body for the active wizard step */
export function FormWizardStepPanel({
  stepKey,
  stepIndex,
  title,
  children,
}: {
  stepKey: string;
  stepIndex: number;
  title: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const [{ index: trackedIndex, direction }, setStepMotion] = useState({
    index: stepIndex,
    direction: 1,
  });

  if (stepIndex !== trackedIndex) {
    setStepMotion({
      index: stepIndex,
      direction: stepIndex > trackedIndex ? 1 : -1,
    });
  }

  if (reduceMotion) {
    return (
      <section id={stepKey} aria-label={title}>
        {children}
      </section>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.section
          key={stepKey}
          id={stepKey}
          aria-label={title}
          custom={direction}
          variants={STEP_SLIDE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={STEP_TRANSITION}
        >
          {children}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
