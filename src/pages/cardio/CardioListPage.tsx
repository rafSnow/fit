import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Flame, Timer, MapPin, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useCardioSessions } from '@/hooks/useCardioSessions';
import { useHeader } from '@/hooks/useHeader';
import { Card } from '@/components/ui/Card';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDuration, formatDistance, formatDate, cn } from '@/lib/utils';

const CardioSkeleton = () => (
  <div className="flex flex-col gap-4 p-4">
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded-full" />)}
    </div>
    {[1, 2, 3].map((i) => (
      <Card key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex space-x-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const CardioIllustration = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-2xl animate-pulse"></div>
    <div className="absolute inset-4 bg-blue-50 dark:bg-blue-800/30 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
    <div className="relative z-10 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-blue-50 dark:border-blue-900/30">
      <Activity className="h-12 w-12 text-blue-500" />
    </div>
    <div className="absolute -top-2 -right-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full shadow-lg">
      <Flame className="h-6 w-6 text-orange-500" />
    </div>
  </div>
);

export default function CardioListPage() {
// ...
  const navigate = useNavigate();
  const { sessions, isLoading } = useCardioSessions();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useHeader('Cardio');

  const activityTypes = ['Corrida', 'Esteira', 'Bicicleta', 'Escada'];

  const filteredAndSortedSessions = useMemo(() => {
    let result = [...sessions];
    
    if (filterType) {
      result = result.filter(s => s.type === filterType);
    }
    
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [sessions, filterType, sortOrder]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthSessions = sessions.filter(s => new Date(s.date) >= firstDayOfMonth);
    
    return {
      count: monthSessions.length,
      duration: monthSessions.reduce((acc, s) => acc + s.durationSeconds, 0),
      distance: monthSessions.reduce((acc, s) => acc + (s.distanceKm || 0), 0),
      calories: monthSessions.reduce((acc, s) => acc + s.calories, 0),
    };
  }, [sessions]);

  if (isLoading) {
    return <CardioSkeleton />;
  }

  const getActivityIcon = (type: string) => {
// ... rest of file ...
    switch (type) {
      case 'Corrida': return '🏃';
      case 'Esteira': return '👟';
      case 'Bicicleta': return '🚴';
      case 'Escada': return '🪜';
      default: return '⏱️';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 pb-12">
      {/* Monthly Summary */}
      {!filterType && sessions.length > 0 && (
        <Card className="bg-blue-600 text-white dark:bg-blue-700 border-none">
          <div className="flex items-center justify-between border-b border-blue-400/30 pb-3 mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">Resumo de {format(new Date(), 'MMMM', { locale: ptBR })}</h3>
            <Badge className="bg-white/20 text-white border-none">{monthlyStats.count} sessões</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase opacity-70">Tempo</span>
              <span className="text-lg font-bold">{formatDuration(monthlyStats.duration)}</span>
            </div>
            <div className="flex flex-col border-l border-blue-400/30 pl-3">
              <span className="text-[10px] uppercase opacity-70">Distância</span>
              <span className="text-lg font-bold">{monthlyStats.distance.toFixed(1)} <span className="text-xs font-normal">km</span></span>
            </div>
            <div className="flex flex-col border-l border-blue-400/30 pl-3">
              <span className="text-[10px] uppercase opacity-70">Calorias</span>
              <span className="text-lg font-bold">{monthlyStats.calories} <span className="text-xs font-normal">kcal</span></span>
            </div>
          </div>
        </Card>
      )}

      {/* Filters & Sort */}
      <div className="sticky top-0 z-30 -mx-4 bg-gray-50/80 px-4 py-3 backdrop-blur-md dark:bg-black/80">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex flex-1 items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterType(null)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                filterType === null
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'bg-white text-gray-600 border border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
              )}
            >
              Todos
            </button>
            {activityTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type === filterType ? null : type)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                  filterType === type
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-white text-gray-600 border border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
                )}
              >
                {type}
              </button>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-shrink-0 h-8 w-8 p-0"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          >
            <ArrowUpDown className={cn("h-4 w-4 transition-transform", sortOrder === 'asc' && "rotate-180")} />
          </Button>
        </div>
      </div>

      {filteredAndSortedSessions.length === 0 ? (
        <EmptyState
          illustration={<CardioIllustration />}
          title={filterType ? `Nenhum registro de ${filterType}` : "Nenhuma sessão"}
          description={filterType ? "Tente mudar o filtro ou registre uma nova sessão." : "Nenhuma sessão registrada. Que tal começar agora?"}
          actionLabel={filterType ? "Ver Todos" : "Registrar Cardio"}
          onAction={() => filterType ? setFilterType(null) : navigate('/cardio/new')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredAndSortedSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="flex items-center space-x-4 active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => navigate(`/cardio/${session.id}`)}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl dark:bg-blue-900/20">
                  {getActivityIcon(session.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{session.type}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(new Date(session.date))}</span>
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Timer className="h-4 w-4 text-blue-500" />
                      <span>{formatDuration(session.durationSeconds)}</span>
                    </div>
                    
                    {session.distanceKm && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span>{formatDistance(session.distanceKm)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>{session.calories} kcal</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
      
      <FAB onClick={() => navigate('/cardio/new')} />
    </div>
  );
}
