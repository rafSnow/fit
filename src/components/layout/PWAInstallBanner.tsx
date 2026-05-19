import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/Button';
import { Download, X } from 'lucide-react';

export const PWAInstallBanner = () => {
  const { showInstallBanner, handleInstallClick, handleDismiss } = usePWAInstall();

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
        
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Download size={24} />
        </div>
        
        <div className="flex flex-col flex-1">
          <span className="font-bold text-sm">Instalar Fitness PWA</span>
          <span className="text-[10px] text-blue-100 uppercase font-black tracking-wider">Acesso rápido e offline</span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleInstallClick}
            className="bg-white text-blue-600 hover:bg-blue-50 border-none font-bold"
          >
            Instalar
          </Button>
          <button 
            onClick={handleDismiss}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
