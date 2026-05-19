import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useExercises } from '@/hooks/useExercises';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/stores/useToastStore';
import type { Exercise } from '@/types/database';
import { extractYouTubeId } from '@/lib/utils';
import { 
  ArrowLeft, Edit2, Trash2, Dumbbell, Info, 
  History, ArrowRight, Video
} from 'lucide-react';

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, delete: deleteExercise } = useExercises();
  const { addToast } = useToastStore();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [sub1, setSub1] = useState<Exercise | null>(null);
  const [sub2, setSub2] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useHeader('Detalhes do Exercício', (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft size={20} />
    </Button>
  ));

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      const ex = await getById(Number(id));
      if (ex) {
        setExercise(ex);
        
        // Load substitutions
        if (ex.sub1Id) {
          const s1 = await getById(ex.sub1Id);
          setSub1(s1 || null);
        } else {
          setSub1(null);
        }
        
        if (ex.sub2Id) {
          const s2 = await getById(ex.sub2Id);
          setSub2(s2 || null);
        } else {
          setSub2(null);
        }
      }
      setIsLoading(false);
    };

    loadData();
  }, [id, getById]);

  const handleDelete = async () => {
    if (!exercise?.id) return;
    
    if (window.confirm('Tem certeza que deseja excluir este exercício customizado?')) {
      try {
        await deleteExercise(exercise.id);
        addToast('Exercício excluído com sucesso!');
        navigate('/exercises');
      } catch (error) {
        addToast(error instanceof Error ? error.message : 'Erro ao excluir exercício', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="p-4 text-center text-gray-500">
        Exercício não encontrado.
      </div>
    );
  }

  const youtubeId = exercise.youtubeUrl ? extractYouTubeId(exercise.youtubeUrl) : null;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {exercise.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{exercise.muscleGroup}</Badge>
              {exercise.secondaryMuscle && (
                <Badge variant="outline">{exercise.secondaryMuscle}</Badge>
              )}
              <Badge variant="secondary">{exercise.equipment}</Badge>
            </div>
          </div>
          {exercise.isCustom && (
            <Badge variant="default">Custom</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {/* History Button */}
        <Link to={`/exercises/${exercise.id}/history`}>
          <Card className="p-4 flex items-center justify-between bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-lg text-white">
                <History size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Histórico de Cargas</span>
                <span className="text-[10px] text-gray-500 uppercase font-black">Ver sua progressão</span>
              </div>
            </div>
            <ArrowRight size={20} className="text-orange-500" />
          </Card>
        </Link>

        {/* Substitutions */}
        {(sub1 || sub2) && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Dumbbell size={20} className="text-blue-500" />
              Substituições
            </h2>
            <div className="grid gap-2">
              {sub1 && (
                <Link to={`/exercises/${sub1.id}`}>
                  <Card className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-sm font-medium px-4">{sub1.name}</span>
                    <ArrowRight size={16} className="text-gray-400 mr-4" />
                  </Card>
                </Link>
              )}
              {sub2 && (
                <Link to={`/exercises/${sub2.id}`}>
                  <Card className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-sm font-medium px-4">{sub2.name}</span>
                    <ArrowRight size={16} className="text-gray-400 mr-4" />
                  </Card>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Video Reference */}
        {exercise.youtubeUrl && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Video size={20} className="text-red-500" />
              Vídeo de Referência
            </h2>
            <Card className="overflow-hidden p-0">
              {youtubeId ? (
                <div 
                  className="aspect-video bg-gray-100 relative group cursor-pointer"
                  onClick={() => window.open(exercise.youtubeUrl, '_blank')}
                >
                  <img 
                    src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} 
                    alt="Thumbnail do vídeo"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="bg-white/90 p-3 rounded-full shadow-lg text-red-600">
                      <Video size={32} />
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => window.open(exercise.youtubeUrl, '_blank')}
                >
                  <Video size={18} className="text-red-600" />
                  Ver Vídeo no YouTube
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Info size={20} className="text-blue-500" />
            Notas de Execução
          </h2>
          <Card className="p-4">
            {exercise.notes ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {exercise.notes}
              </p>
            ) : (
              <p className="text-sm italic text-gray-400">
                Nenhuma nota de execução cadastrada.
              </p>
            )}
          </Card>
        </div>
      </div>

      {exercise.isCustom && (
        <div className="flex gap-3 pt-4 sticky bottom-4 z-20">
          <Button
            className="flex-1 shadow-lg"
            onClick={() => navigate(`/exercises/${exercise.id}/edit`)}
          >
            <Edit2 size={18} className="mr-2" />
            Editar
          </Button>
          <Button
            variant="danger"
            className="flex-1 shadow-lg"
            onClick={handleDelete}
          >
            <Trash2 size={18} className="mr-2" />
            Excluir
          </Button>
        </div>
      )}
    </div>
  );
}
