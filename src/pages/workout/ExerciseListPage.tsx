import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHeader } from '@/hooks/useHeader';
import { useExercises } from '@/hooks/useExercises';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FAB } from '@/components/ui/FAB';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search, Plus, Dumbbell, Filter } from 'lucide-react';

const SearchIllustration = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50 rounded-full blur-2xl"></div>
    <div className="relative z-10 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
      <Search className="h-12 w-12 text-gray-400" />
    </div>
    <div className="absolute top-4 right-4 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full shadow-lg">
      <Filter className="h-5 w-5 text-blue-500" />
    </div>
  </div>
);

const MUSCLE_GROUPS = [
  { label: 'Todos os Grupos', value: 'all' },
  { label: 'Peito', value: 'Peito' },
  { label: 'Costas', value: 'Costas' },
  { label: 'Ombro', value: 'Ombro' },
  { label: 'Bíceps', value: 'Bíceps' },
  { label: 'Tríceps', value: 'Tríceps' },
  { label: 'Pernas', value: 'Pernas' },
  { label: 'Glúteos', value: 'Glúteos' },
  { label: 'Abdômen', value: 'Abdômen' },
];

const ExerciseSkeleton = () => (
  <div className="flex flex-col gap-4 p-4">
    <div className="flex flex-col gap-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="grid gap-3 mt-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <span className="text-gray-200">•</span>
            <Skeleton className="h-4 w-24" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default function ExerciseListPage() {
  useHeader('Exercícios');
  const navigate = useNavigate();
  const { exercises, isLoading } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('all');

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscle = muscleGroup === 'all' || ex.muscleGroup === muscleGroup;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, searchQuery, muscleGroup]);

  if (isLoading) {
    return <ExerciseSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex flex-col gap-3 sticky top-0 bg-white dark:bg-gray-950 z-10 py-2">
        <Input
          placeholder="Buscar exercício..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <div className="absolute left-3 top-[1.6rem] text-gray-400">
          <Search size={18} />
        </div>

        <Select
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          options={MUSCLE_GROUPS}
        />
      </div>

      {filteredExercises.length > 0 ? (
        <div className="grid gap-3">
          {filteredExercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform w-full"
                onClick={() => navigate(`/exercises/${exercise.id}`)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {exercise.name}
                    </span>
                    {exercise.isCustom && (
                      <Badge variant="secondary">Custom</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Dumbbell size={14} />
                    <span>{exercise.muscleGroup}</span>
                    <span className="text-gray-300">•</span>
                    <span>{exercise.equipment}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          illustration={<SearchIllustration />}
          title="Nenhum exercício encontrado"
          description="Tente ajustar os filtros ou a busca para encontrar o que procura."
          actionLabel="Limpar Filtros"
          onAction={() => {
            setSearchQuery('');
            setMuscleGroup('all');
          }}
        />
      )}

      <FAB
        icon={<Plus />}
        onClick={() => navigate('/exercises/new')}
        aria-label="Novo Exercício"
      />
    </div>
  );
}
