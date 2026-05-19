import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useRoutines } from '@/hooks/useRoutines';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Play, Calendar, History, ArrowRight, 
  Dumbbell, Timer, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/utils';
import type { Routine, WorkoutSession } from '@/types/database';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface EnrichedSession extends WorkoutSession {
  routineName?: string;
}

const WorkoutSkeleton = () => (
  <div className="p-4 space-y-8">
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Card className="p-5 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
      </Card>
    </div>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-4 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-4" />
        </Card>
      ))}
    </div>
  </div>
);

const WorkoutIllustration = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-2xl animate-pulse"></div>
    <div className="relative z-10 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-blue-50 dark:border-blue-900/30 rotate-3">
      <Dumbbell className="h-12 w-12 text-blue-500" />
    </div>
    <div className="absolute top-2 right-2 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full shadow-lg -rotate-12">
      <Timer className="h-6 w-6 text-emerald-500" />
    </div>
  </div>
);

export default function WorkoutHomePage() {
  useHeader('Treino');
  const navigate = useNavigate();
  const { getForToday } = useRoutines();
  const { recentSessions, createSession, getActiveSession } = useWorkoutSessions();

  const [todayRoutines, setTodayRoutines] = useState<Routine[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const active = await getActiveSession();
      if (active) {
        setActiveSession(active);
      }

      const routines = await getForToday();
      setTodayRoutines(routines);
      setIsLoading(false);
    };
    loadData();
  }, [getForToday, getActiveSession]);

  const handleStartWorkout = async (routineId: number) => {
    try {
      await createSession(routineId);
      navigate('/workout/active');
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  if (isLoading) {
    return <WorkoutSkeleton />;
  }

  return (
    <div className="p-4 flex flex-col gap-8 pb-24">
      {/* Active Session Prompt */}
      {activeSession && (
        <section className="flex flex-col gap-4">
          <Card className="p-5 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 flex flex-col gap-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Treino em andamento</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Você tem um treino que não foi finalizado. Deseja continuar?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/workout/active')}
                className="flex-1 font-bold gap-2"
              >
                Continuar Treino
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/workout/summary/${activeSession.id}`)}
                className="font-bold"
              >
                Ver Resumo
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* Today's Routine */}
      {!activeSession && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar size={20} className="text-blue-500" />
            Treino de Hoje
          </h2>

          {todayRoutines.length > 0 ? (
            <div className="flex flex-col gap-3">
              {todayRoutines.map((routine) => (
                <Card key={routine.id} className="p-5 flex flex-col gap-4 border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{routine.name}</h3>
                      <p className="text-sm text-gray-500">Programado para hoje</p>
                    </div>
                    <Badge variant="default">Recomendado</Badge>
                  </div>
                  
                  <Button 
                    onClick={() => handleStartWorkout(routine.id!)}
                    className="w-full py-6 text-lg font-bold gap-2 shadow-lg shadow-blue-200 dark:shadow-none"
                  >
                    <Play size={20} fill="currentColor" />
                    Iniciar Treino
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              illustration={<WorkoutIllustration />}
              title="Sem treino programado"
              description="Nenhuma rotina vinculada ao dia de hoje. Que tal descansar ou escolher uma rotina manualmente?"
              actionLabel="Ver Minhas Rotinas"
              onAction={() => navigate('/routines')}
            />
          )}
        </section>
      )}

      {/* Recent History */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <History size={20} className="text-orange-500" />
            Histórico Recente
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/workout')} className="text-blue-500">
            Ver tudo
          </Button>
        </div>

        {recentSessions.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentSessions.map((session) => (
              <Card key={session.id} className="p-4 flex items-center gap-4">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                    {(session as EnrichedSession).routineName || 'Treino'}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(session.startedAt)}
                    </span>
                    {session.durationSeconds && (
                      <span className="flex items-center gap-1">
                        <Timer size={12} />
                        {formatDuration(session.durationSeconds)}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight size={16} className="text-gray-300" />
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic text-center py-4">
            Suas últimas sessões aparecerão aqui.
          </p>
        )}
      </section>
    </div>
  );
}
