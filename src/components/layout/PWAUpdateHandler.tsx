import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToastStore } from '@/stores/useToastStore';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';

export const PWAUpdateHandler = () => {
  const { addToast } = useToastStore();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      console.log('SW Registered');
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      addToast(
        <div className="flex flex-col gap-2">
          <span className="font-bold">Nova versão disponível!</span>
          <span className="text-xs">Atualize para receber as últimas melhorias.</span>
          <Button 
            size="sm" 
            className="mt-1 gap-2 h-9 font-bold"
            onClick={() => updateServiceWorker(true)}
          >
            <RefreshCw size={14} />
            Atualizar Agora
          </Button>
        </div>,
        'info',
        10000 // Show for 10 seconds
      );
    }
  }, [needRefresh, addToast, updateServiceWorker]);

  return null;
};
