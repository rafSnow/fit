import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { ToastContainer } from '../ui/Toast';
import { PWAInstallBanner } from './PWAInstallBanner';
import { PWAUpdateHandler } from './PWAUpdateHandler';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden">
      <ToastContainer />
      <PWAUpdateHandler />
      <PWAInstallBanner />
      <Header />
      <main className="flex-1 overflow-y-auto px-4 pt-14 pb-20">
        <div className="mx-auto max-w-lg min-h-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};
