import { NavLink } from 'react-router-dom';
import { Activity, Dumbbell, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const tabs = [
    { label: 'Cardio', path: '/cardio', icon: Activity },
    { label: 'Treino', path: '/workout', icon: Dumbbell },
    { label: 'Métricas', path: '/metrics', icon: BarChart2 },
    { label: 'Config', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/90 pb-safe backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
      <div className="flex h-16 items-center justify-around">
        {tabs.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'relative flex h-full w-full flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-90 outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex items-center justify-center rounded-full px-4 py-1 transition-colors',
                  isActive && 'bg-blue-50 dark:bg-blue-900/20'
                )}>
                  <Icon className={cn('h-6 w-6', isActive && 'stroke-[2.5px]')} />
                </div>
                <span className={cn('text-[10px] font-bold leading-none', isActive ? 'opacity-100' : 'opacity-90')}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
