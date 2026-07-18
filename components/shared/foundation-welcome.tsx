'use client';

import { motion } from 'motion/react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cardReveal, fadeUp, pageTransition } from '@/lib/motion/presets';

function FoundationWelcome() {
  return (
    <motion.main
      initial="initial"
      animate="animate"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-3 py-6 sm:px-6 sm:py-12"
      variants={pageTransition}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,87,255,0.09),transparent_42%)]"
      />
      <motion.section className="max-w-content relative w-full sm:max-w-2xl" variants={cardReveal}>
        <Card>
          <CardHeader className="gap-8 p-6 sm:p-10">
            <motion.div className="flex items-center justify-between gap-4" variants={fadeUp}>
              <div className="flex items-center gap-3">
                <span aria-hidden className="bg-guardian-blue size-2.5 rounded-full" />
                <span className="text-text-primary text-sm font-semibold tracking-[0.18em] uppercase">
                  Guardian
                </span>
              </div>
              <Badge variant="learning">Foundation established</Badge>
            </motion.div>
            <motion.div className="max-w-xl space-y-4" variants={fadeUp}>
              <p className="text-guardian-blue text-sm font-medium">Strategic operating system</p>
              <CardTitle className="text-4xl tracking-[-0.045em] sm:text-5xl">
                Clear thinking starts with a considered foundation.
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6 pb-6 sm:px-10 sm:pb-10">
            <motion.p
              className="text-text-secondary max-w-lg text-base leading-7"
              variants={fadeUp}
            >
              Guardian is ready to turn context into clarity, while keeping the founder in control.
            </motion.p>
            <motion.div className="bg-border-soft h-px w-full" variants={fadeUp} />
            <motion.p className="text-text-secondary text-sm" variants={fadeUp}>
              Design foundation ready for the next mission.
            </motion.p>
          </CardContent>
        </Card>
      </motion.section>
    </motion.main>
  );
}

export { FoundationWelcome };
