"use client";

import { animate, motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const WELCOME_TEXT = "Chào mừng đến với CLB Chạy bộ CMC Global";
const RUN_DURATION = 4;
const TEXT_DURATION = 4;
const REDIRECT_MS = 5000;

const COLORS = {
  bg: "#99FFFF",
  text: "#1E3A8A",
  track: "#E5E7EB",
} as const;

export default function Loading() {
  const router = useRouter();
  const pathname = usePathname();
  const textControls = useAnimation();
  const runnerProgress = useMotionValue(0);

  const runnerLeft = useTransform(runnerProgress, (value) => `${value * 100}%`);

  useEffect(() => {
    const runnerAnimation = animate(runnerProgress, 1, {
      duration: RUN_DURATION,
      ease: "linear",
    });

    textControls.start("visible");

    const timer = window.setTimeout(() => {
      if (pathname !== "/") {
        router.push("/");
      }
    }, REDIRECT_MS);

    return () => {
      runnerAnimation.stop();
      window.clearTimeout(timer);
    };
  }, [runnerProgress, textControls, router, pathname]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: COLORS.bg }}
      role="status"
      aria-live="polite"
      aria-label="Đang tải trang"
    >
      <div className="relative w-full max-w-2xl">
        <div className="relative pt-10 pb-2">
          <div
            className="h-2 w-full rounded-full shadow-inner"
            style={{ backgroundColor: COLORS.track }}
          />

          <motion.div
            className="absolute top-0 select-none text-3xl sm:text-4xl md:text-5xl"
            style={{ left: runnerLeft, x: "-50%" }}
          >
            <motion.span
              className="inline-block"
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              aria-hidden
            >
              🏃‍♂️
            </motion.span>
          </motion.div>
        </div>

        <motion.div
          className="mt-8 overflow-hidden"
          initial="hidden"
          animate={textControls}
          variants={{
            hidden: { opacity: 0, x: -100 },
            visible: {
              opacity: 1,
              x: 0,
              transition: { duration: TEXT_DURATION, ease: "easeOut" },
            },
          }}
        >
          <h1
            className="font-display text-lg font-bold leading-snug sm:text-xl md:text-2xl lg:text-3xl"
            style={{ color: COLORS.text }}
          >
            {WELCOME_TEXT}
          </h1>
        </motion.div>

        <motion.p
          className="mt-6 text-center text-xs font-medium sm:text-sm"
          style={{ color: COLORS.text }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          Đang chuẩn bị...
        </motion.p>
      </div>
    </div>
  );
}
