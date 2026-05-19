import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useHeaderStore } from '@/stores/useHeaderStore';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { title: customTitle, actions } = useHeaderStore();

  const getTitle = (path: string) => {
    if (customTitle) return customTitle;
    if (path.startsWith('/cardio')) return 'Cardio';
    if (path.startsWith('/workout')) return 'Treino';
    if (path.startsWith('/exercises')) return 'Exercícios';
    if (path.startsWith('/routines')) return 'Rotinas';
    if (path.startsWith('/metrics')) return 'Métricas';
    if (path.startsWith('/settings')) return 'Configurações';
    return 'Fitness PWA';
  };

  const isSubRoute = location.pathname.split('/').filter(Boolean).length > 1;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center border-b border-gray-200 bg-white/80 px-4 pt-safe backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-2">
          {isSubRoute && (
            <Button
              variant="ghost"
              size="sm"
              className="px-1"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getTitle(location.pathname)}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      </div>
    </header>
  );
};
