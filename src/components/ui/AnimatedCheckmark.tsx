import { motion } from 'framer-motion';

export const AnimatedCheckmark = ({ size = 48, className = "" }: { size?: number, className?: string }) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      className={className}
      initial="initial"
      animate="animate"
    >
      <motion.circle
        cx="25"
        cy="25"
        r="20"
        fill="transparent"
        stroke="#10B981"
        strokeWidth="4"
        variants={{
          initial: { pathLength: 0 },
          animate: { pathLength: 1 }
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      <motion.path
        d="M15 25L22 32L35 18"
        fill="transparent"
        stroke="#10B981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          initial: { pathLength: 0 },
          animate: { pathLength: 1 }
        }}
        transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
};
