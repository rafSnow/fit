import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  illustration?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export const EmptyState = ({
  icon,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) => {
  const renderIcon = () => {
    if (illustration) return <div className="mb-8">{illustration}</div>;
    if (React.isValidElement(icon)) {
      return <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800 mb-6">{icon}</div>;
    }
    if (icon) {
      const Icon = icon as LucideIcon;
      return (
        <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800 mb-6">
          <Icon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {renderIcon()}
      <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-[260px] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-8 font-bold px-8 h-12 shadow-lg shadow-blue-100 dark:shadow-none" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : action ? (
        <div className="mt-8">{action}</div>
      ) : null}
    </div>
  );
};
