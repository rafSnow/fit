import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useExercises } from '@/hooks/useExercises';
import { useRoutines } from '@/hooks/useRoutines';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToastStore } from '@/stores/useToastStore';
import { Trophy, Clock, Dumbbell, BarChart3, Share2, Save, Trash2, FileText, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { hapticFeedback } from '@/lib/utils';
import type { WorkoutSession, SessionSet, Exercise, RoutineExercise, Routine } from '@/types/database';

export default function WorkoutSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSessionById, getSessionSets, finishSession, deleteSession } = useWorkoutSessions();
  const { getById: getExerciseById } = useExercises();
  const { getById: getRoutineById } = useRoutines();
  const { addToast } = useToastStore();
  const { reset: resetStore } = useWorkoutStore();

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [sets, setSets] = useState<SessionSet[]>([]);
  const [exercises, setExercises] = useState<Record<number, Exercise>>({});
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useHeader('Resumo do Treino', (
    <Button variant="ghost" size="sm" onClick={() => navigate('/workout')}>
      Fechar
    </Button>
  ));

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const sessionData = await getSessionById(Number(id));
      if (!sessionData) {
        navigate('/workout');
        return;
      }
      setSession(sessionData);

      // Load Routine Exercises to check techniques
      const routineData = await getRoutineById(sessionData.routineId);
      if (routineData) {
        setRoutine(routineData);
        setRoutineExercises(routineData.exercises as RoutineExercise[] || []);
      }

      const setsData = await getSessionSets(Number(id));
      setSets(setsData);

      // Load exercise details
      const exerciseIds = Array.from(new Set(setsData.map(s => s.exerciseId)));
      const exerciseMap: Record<number, Exercise> = {};
      await Promise.all(exerciseIds.map(async (exId) => {
        const ex = await getExerciseById(exId);
        if (ex) exerciseMap[exId] = ex;
      }));
      setExercises(exerciseMap);
      
      setIsLoading(false);
    };
    loadData();
  }, [id, getExerciseById, getRoutineById, getSessionById, getSessionSets, navigate]);

  const stats = useMemo(() => {
    const totalVolume = sets.reduce((acc, set) => acc + (set.weightKg * set.reps), 0);
    const totalReps = sets.reduce((acc, set) => acc + set.reps, 0);
    const workSets = sets.filter(s => s.setType === 'work').length;
    const failureSets = sets.filter(s => s.toFailure).length;
    const dropSets = sets.filter(s => s.setType === 'drop').length;
    
    // Count supersets/bi-sets
    const supersets = routineExercises.filter(re => re.technique === 'Superset').length;
    const bisets = routineExercises.filter(re => re.technique === 'Bi-set').length;
    
    // Calculate duration even if session not finished yet
    let duration = session?.durationSeconds || 0;
    if (duration === 0 && session?.startedAt) {
      duration = Math.floor((new Date().getTime() - new Date(session.startedAt).getTime()) / 1000);
    }
    
    return {
      totalVolume,
      totalReps,
      workSets,
      failureSets,
      dropSets,
      supersets,
      bisets,
      duration
    };
  }, [sets, session, routineExercises]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleExportPDF = () => {
    if (!session || !routine) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = 25;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(30, 64, 175); // Blue-800
    doc.text('RESUMO DO TREINO', margin, y);
    y += 15;

    // Header Info
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.text(`Rotina: ${routine.name}`, margin, y);
    y += 7;
    doc.text(`Data: ${format(new Date(session.startedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, y);
    y += 7;
    doc.text(`Duração Total: ${formatDuration(stats.duration)}`, margin, y);
    y += 15;

    // Stats Box
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.roundedRect(margin, y, 170, 25, 3, 3, 'FD');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text('VOLUME TOTAL', margin + 10, y + 10);
    doc.text('SÉRIES', margin + 60, y + 10);
    doc.text('REPETIÇÕES', margin + 110, y + 10);

    doc.setFontSize(14);
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text(`${stats.totalVolume.toLocaleString()} kg`, margin + 10, y + 18);
    doc.text(`${stats.workSets}`, margin + 60, y + 18);
    doc.text(`${stats.totalReps}`, margin + 110, y + 18);
    y += 35;

    // Exercises
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55); // Gray-800
    doc.text('Exercícios Realizados', margin, y);
    y += 10;

    const setsByExercise: Record<number, SessionSet[]> = {};
    sets.forEach(set => {
      if (!setsByExercise[set.exerciseId]) setsByExercise[set.exerciseId] = [];
      setsByExercise[set.exerciseId].push(set);
    });

    Object.entries(setsByExercise).forEach(([exId, exSets]) => {
      const exercise = exercises[Number(exId)];
      const re = routineExercises.find(r => r.exerciseId === Number(exId));

      // Check for page break
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(exercise?.name || 'Exercício', margin, y);
      
      if (re && re.technique !== 'Normal') {
        doc.setFontSize(9);
        doc.setTextColor(147, 51, 234); // Purple-600
        doc.text(` Técnica: ${re.technique}`, margin + 80, y);
      }
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      
      const setsStr = exSets.map((s, i) => {
        let str = `${i + 1}. ${s.weightKg}kg x ${s.reps}`;
        if (s.toFailure) str += ' (Falha)';
        return str;
      }).join('  |  ');
      
      doc.text(setsStr, margin, y);
      y += 12;
    });

    // Progression Suggestions
    const suggestions = routineExercises.filter(re => re.progressionSuggested);
    if (suggestions.length > 0) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      
      y += 5;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105); // Green-600
      doc.text('Próximos Passos: Sugestões de Progressão', margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      
      suggestions.forEach(re => {
        const ex = exercises[re.exerciseId];
        doc.text(`- ${ex?.name}: Aumentar carga na próxima sessão.`, margin, y);
        y += 6;
      });
    }

    doc.save(`treino-${format(new Date(session.startedAt), 'yyyy-MM-dd')}.pdf`);
    addToast('PDF gerado com sucesso!', 'success');
  };

  const handleSave = async () => {
    if (!session?.id) return;
    setIsSaving(true);
    try {
      await finishSession(session.id);
      resetStore();
      hapticFeedback.workoutComplete();
      addToast('Treino salvo com sucesso! 🏆');
      navigate('/workout');
    } catch {
      hapticFeedback.error();
      addToast('Erro ao salvar treino.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!session?.id) return;
    if (!window.confirm('Deseja realmente descartar este treino? Todos os registros serão apagados.')) return;
    
    await deleteSession(session.id);
    resetStore();
    addToast('Treino descartado.', 'info');
    navigate('/workout');
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-6 w-40" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Group sets by exercise for the UI
  const setsByExercise: Record<number, SessionSet[]> = {};
  sets.forEach(set => {
    if (!setsByExercise[set.exerciseId]) setsByExercise[set.exerciseId] = [];
    setsByExercise[set.exerciseId].push(set);
  });

  const suggestions = routineExercises.filter(re => re.progressionSuggested);

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success Header */}
      <div className="flex flex-col items-center gap-2 text-center py-4">
        <div className="h-20 w-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-500 shadow-inner">
          <Trophy size={40} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100">Treino Concluído!</h2>
        <p className="text-gray-500 font-medium">
          {session?.startedAt && format(new Date(session.startedAt), "eeee, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 flex flex-col gap-1 border-blue-50 dark:border-blue-900/20 bg-blue-50/30 dark:bg-blue-900/10">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Clock size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Duração</span>
          </div>
          <span className="text-xl font-black text-gray-900 dark:text-gray-100">{formatDuration(stats.duration)}</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-purple-50 dark:border-purple-900/20 bg-purple-50/30 dark:bg-purple-900/10">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <BarChart3 size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Volume Total</span>
          </div>
          <span className="text-xl font-black text-gray-900 dark:text-gray-100">{stats.totalVolume.toLocaleString()} kg</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-emerald-50 dark:border-emerald-900/20 bg-emerald-50/30 dark:bg-emerald-900/10">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Dumbbell size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Séries</span>
          </div>
          <span className="text-xl font-black text-gray-900 dark:text-gray-100">{stats.workSets} de trabalho</span>
        </Card>
        <Card className="p-4 flex flex-col gap-1 border-orange-50 dark:border-orange-900/20 bg-orange-50/30 dark:bg-orange-900/10">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Share2 size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Repetições</span>
          </div>
          <span className="text-xl font-black text-gray-900 dark:text-gray-100">{stats.totalReps} total</span>
        </Card>
      </div>

      {/* Technical Achievements */}
      {(stats.failureSets > 0 || stats.dropSets > 0 || stats.supersets > 0 || stats.bisets > 0) && (
        <div className="flex flex-col gap-3">
          <h3 className="font-black text-lg text-gray-900 dark:text-gray-100 px-1">Conquistas Técnicas</h3>
          <div className="flex flex-wrap gap-2">
            {stats.failureSets > 0 && (
              <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100 gap-1 py-1.5 px-3">
                🔥 {stats.failureSets} séries à falha
              </Badge>
            )}
            {stats.dropSets > 0 && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 gap-1 py-1.5 px-3">
                💧 {stats.dropSets} drop sets
              </Badge>
            )}
            {stats.supersets > 0 && (
              <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 gap-1 py-1.5 px-3">
                🔄 {stats.supersets} supersets
              </Badge>
            )}
            {stats.bisets > 0 && (
              <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 gap-1 py-1.5 px-3">
                🔄 {stats.bisets} bi-sets
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Progression Suggestions UI */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-black text-lg text-gray-900 dark:text-gray-100 px-1 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" />
            Sugestões de Progressão
          </h3>
          <div className="flex flex-col gap-2">
            {suggestions.map(re => {
              const ex = exercises[re.exerciseId];
              return (
                <div key={re.id} className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{ex?.name}</span>
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Carga aumentada para o próximo treino</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercise List */}
      <div className="flex flex-col gap-4">
        <h3 className="font-black text-lg text-gray-900 dark:text-gray-100 px-1">Exercícios Realizados</h3>
        {Object.entries(setsByExercise).map(([exId, exSets]) => {
          const exercise = exercises[Number(exId)];
          return (
            <Card key={exId} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">{exercise?.name}</h4>
                  <p className="text-xs text-gray-500">{exercise?.muscleGroup}</p>
                </div>
                <Badge variant="outline">{exSets.length} séries</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {exSets.map((set, idx) => (
                  <div 
                    key={set.id} 
                    className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded text-[10px] font-medium border border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-gray-400 mr-1">{idx + 1}.</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{set.weightKg}kg</span>
                    <span className="mx-1">×</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{set.reps}</span>
                    {set.toFailure && <span className="ml-1 text-red-500">🔥</span>}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <Button 
          onClick={handleSave} 
          isLoading={isSaving}
          className="h-16 text-lg font-black gap-3 shadow-xl shadow-blue-200 dark:shadow-none"
        >
          {!isSaving && <Save size={24} />}
          Salvar Treino
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleExportPDF} className="h-14 font-bold gap-2">
            <FileText size={20} />
            PDF
          </Button>
          <Button variant="ghost" onClick={handleDiscard} className="h-14 text-red-500 font-bold gap-2">
            <Trash2 size={20} />
            Descartar
          </Button>
        </div>
      </div>
    </div>
  );
}
