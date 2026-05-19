import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHeader } from '@/hooks/useHeader';
import { useRoutines } from '@/hooks/useRoutines';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus, Calendar, Dumbbell, ChevronRight } from 'lucide-react';

const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const WorkoutIllustration = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-2xl"></div>
    <div className="relative z-10 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-blue-50 dark:border-blue-900/30">
      <Calendar className="h-12 w-12 text-blue-500" />
    </div>
    <div className="absolute top-0 right-0 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full shadow-lg">
      <Dumbbell className="h-6 w-6 text-emerald-500" />
    </div>
  </div>
);

const RoutineSkeleton = () => (
  <div className="p-4 space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(j => <Skeleton key={j} className="h-5 w-10 rounded-full" />)}
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-3 w-20" />
        </div>
      </Card>
    ))}
  </div>
);

export default function RoutineListPage() {
  useHeader('Minhas Rotinas');
  const navigate = useNavigate();
  const { routines, isLoading } = useRoutines();

  if (isLoading) {
    return <RoutineSkeleton />;
  }

  return (
    <div className="p-4 pb-24 flex flex-col gap-4">
      {routines.length > 0 ? (
        <div className="grid gap-3">
          {routines.map((routine, index) => (
            <motion.div
              key={routine.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform w-full"
                onClick={() => navigate(`/routines/${routine.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {routine.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Dumbbell size={14} />
                      <span>{(routine as typeof routine & { exerciseCount?: number }).exerciseCount || 0} exercícios</span>
                    </div>
                  </div>
                  <Badge variant={routine.isActive ? 'success' : 'secondary'}>
                    {routine.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {routine.days.map((dayIndex) => (
                    <span
                      key={dayIndex}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                    >
                      {DAYS_SHORT[dayIndex]}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-end text-blue-500 text-xs font-medium gap-1 mt-1">
                  Ver detalhes
                  <ChevronRight size={14} />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          illustration={<WorkoutIllustration />}
          title="Nenhuma rotina criada"
          description="Crie sua primeira rotina para começar."
          actionLabel="Criar Rotina"
          onAction={() => navigate('/routines/new')}
        />
      )}

      <FAB
        icon={<Plus />}
        onClick={() => navigate('/routines/new')}
        aria-label="Nova Rotina"
      />
    </div>
  );
}
