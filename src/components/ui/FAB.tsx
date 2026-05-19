import { Plus } from 'lucide-react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FABProps extends HTMLMotionProps<"button"> {
  icon?: React.ReactNode;
}

export const FAB = ({ className, icon, children, ...props }: FABProps) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      aria-label={props['aria-label'] || "Adicionar"}
      className={cn(
        'fixed right-6 bottom-24 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg dark:bg-blue-500 z-50 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black',
        className
      )}
      {...props}
    >
      {icon || children || <Plus className="h-6 w-6" />}
    </motion.button>
  );
};
