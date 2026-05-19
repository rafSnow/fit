import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useRoutines } from '@/hooks/useRoutines';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FAB } from '@/components/ui/FAB';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { useToastStore } from '@/stores/useToastStore';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  ArrowLeft, Plus, GripVertical, Settings2, 
  Trash2, Dumbbell, PlayCircle, Edit
} from 'lucide-react';

const RoutineIllustration = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-xl animate-pulse"></div>
    <div className="relative z-10 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-blue-50 dark:border-blue-900/30">
      <Dumbbell className="h-10 w-10 text-blue-500" />
    </div>
    <div className="absolute -top-1 -right-1 p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full shadow-md">
      <Plus className="h-4 w-4 text-emerald-500" />
    </div>
  </div>
);
import type { Routine, RoutineExercise, Exercise } from '@/types/database';

export default function RoutineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getById, addExercise, removeExercise, 
    delete: deleteRoutine,
    reorderExercises
  } = useRoutines();
  const { createSession } = useWorkoutSessions();
  const { addToast } = useToastStore();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exercises, setExercises] = useState<(RoutineExercise & { exercise?: Exercise })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useHeader('Configurar Rotina', (
    <Button variant="ghost" size="sm" onClick={() => navigate('/routines')}>
      <ArrowLeft size={20} />
    </Button>
  ));

  const loadData = useCallback(async () => {
    if (!id) return;
    const data = await getById(Number(id));
    if (data) {
      setRoutine(data);
      setExercises(data.exercises);
    }
    setIsLoading(false);
  }, [id, getById]);

  useEffect(() => {
    const timeoutId = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const handleAddExercise = async (exercise: Exercise | undefined) => {
    if (!exercise || !id) return;
    
    try {
      await addExercise(Number(id), exercise.id!);
      addToast('Exercício adicionado!');
      setIsPickerOpen(false);
      loadData();
    } catch {
      addToast('Erro ao adicionar exercício', 'error');
    }
  };

  const handleRemoveExercise = async (reId: number) => {
    if (window.confirm('Remover este exercício da rotina?')) {
      await removeExercise(reId);
      loadData();
    }
  };

  const handleDeleteRoutine = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta rotina? Todos os exercícios vinculados serão removidos.')) {
      await deleteRoutine(Number(id));
      addToast('Rotina excluída');
      navigate('/routines');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newExercises = [...exercises];
    const draggedItem = newExercises[draggedIndex];
    newExercises.splice(draggedIndex, 1);
    newExercises.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setExercises(newExercises);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    if (!id) return;
    
    const reorderedIds = exercises.map(ex => ex.id!).filter(Boolean) as number[];
    await reorderExercises(Number(id), reorderedIds);
    addToast('Ordem atualizada', 'success');
  };

  const handleStartWorkout = async () => {
    if (!id || exercises.length === 0) return;
    try {
      await createSession(Number(id));
      navigate('/workout/active');
    } catch (error) {
      console.error('Error starting workout:', error);
      addToast('Erro ao iniciar treino', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!routine) return <div className="p-4">Rotina não encontrada.</div>;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      {/* Header Info */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {routine.name}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant={routine.isActive ? 'success' : 'secondary'}>
                {routine.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
              <span className="text-xs text-gray-500">
                {exercises.length} exercícios
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/routines/${id}/edit`)}>
              <Edit size={16} />
            </Button>
            <Button variant="outline" size="sm" className="text-red-500" onClick={handleDeleteRoutine}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Dumbbell size={20} className="text-blue-500" />
          Exercícios na Rotina
        </h2>

        {exercises.length > 0 ? (
          <div className="grid gap-3">
            {exercises.map((re, index) => (
              <Card 
                key={re.id} 
                className={cn(
                  "p-3 flex items-center gap-3 transition-all duration-200",
                  draggedIndex === index ? "opacity-50 border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                  <GripVertical size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                    {re.exercise?.name || 'Exercício não encontrado'}
                  </h4>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{re.exercise?.muscleGroup}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-medium dark:text-blue-400">
                        {re.workSets}x{re.repsTarget} · {re.restSeconds}s descanso · RPE {re.rpe}
                      </span>
                    </div>
                    {re.technique !== 'Normal' && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="success" className="text-[10px] py-0 px-1.5 h-auto">
                          {re.technique}
                          {(re.technique === 'Superset' || re.technique === 'Bi-set') && re.supersetWith && (
                            <span className="ml-1 opacity-80">com {exercises.find(e => e.exerciseId === re.supersetWith)?.exercise?.name || '...'}</span>
                          )}
                          {re.technique === 'Drop Set' && re.dropNum && (
                            <span className="ml-1 opacity-80">({re.dropNum} drops)</span>
                          )}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(`/routines/${id}/exercises/${re.id}`)}
                  >
                    <Settings2 size={18} className="text-gray-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-500"
                    onClick={() => handleRemoveExercise(re.id!)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            illustration={<RoutineIllustration />}
            title="Rotina Vazia"
            description="Esta rotina ainda não possui exercícios. Adicione alguns para começar seu treino."
            actionLabel="Adicionar Exercício"
            onAction={() => setIsPickerOpen(true)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="pt-4">
        <Button 
          className="w-full flex items-center justify-center gap-2 py-6"
          onClick={handleStartWorkout}
          disabled={exercises.length === 0}
        >
          <PlayCircle size={20} />
          Começar Treino
        </Button>
      </div>

      <FAB
        icon={<Plus />}
        onClick={() => setIsPickerOpen(true)}
        aria-label="Adicionar Exercício"
      />

      <BottomSheet
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Adicionar Exercício"
      >
        <div className="pb-8">
          <p className="text-sm text-gray-500 mb-4">
            Escolha um exercício para adicionar à sua rotina "{routine.name}".
          </p>
          <ExercisePicker
            onSelect={handleAddExercise}
            placeholder="Buscar por nome ou grupo..."
          />
        </div>
      </BottomSheet>
    </div>
  );
}
