import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  TrendingUp, 
  Repeat, 
  Weight, 
  ArrowLeft, 
  Calendar 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useHeader } from '@/hooks/useHeader';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useExercises } from '@/hooks/useExercises';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

const HistoryIllustration = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 rounded-full blur-xl"></div>
    <div className="relative z-10 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-orange-50 dark:border-orange-900/30">
      <HistoryIcon size={40} className="text-orange-500" />
    </div>
    <div className="absolute -bottom-1 -right-1 p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-md">
      <TrendingUp className="h-4 w-4 text-blue-500" />
    </div>
  </div>
);
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Exercise, SessionSet } from '@/types/database';

export default function ExerciseHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getById: getExerciseById } = useExercises();
  const { getSetHistory } = useWorkoutSessions();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<SessionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'weight' | 'volume'>('weight');

  useHeader('Histórico do Exercício', (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft size={20} />
    </Button>
  ));

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      const ex = await getExerciseById(Number(id));
      if (ex) setExercise(ex);

      const sets = await getSetHistory(Number(id));
      setHistory(sets);
      setIsLoading(false);
    };
    loadData();
  }, [id, getExerciseById, getSetHistory]);

  const chartData = useMemo(() => {
    // Group by session (date)
    const sessions: Record<string, { weight: number, volume: number }> = {};
    
    [...history].reverse().forEach(set => {
      const date = format(new Date(set.completedAt), 'dd/MM');
      if (!sessions[date]) {
        sessions[date] = { weight: 0, volume: 0 };
      }
      
      // Update max weight
      if (set.weightKg > sessions[date].weight) {
        sessions[date].weight = set.weightKg;
      }
      
      // Accumulate volume
      sessions[date].volume += (set.weightKg * set.reps);
    });

    return Object.entries(sessions).map(([date, data]) => ({
      date,
      ...data
    }));
  }, [history]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    
    const maxWeight = Math.max(...history.map(s => s.weightKg));
    const totalVolume = history.reduce((acc, s) => acc + (s.weightKg * s.reps), 0);
    const sessionIds = new Set(history.map(s => s.sessionId));
    
    return {
      maxWeight,
      totalVolume,
      totalSessions: sessionIds.size
    };
  }, [history]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // Group history by date/session for the list
  const historyBySession: Record<string, SessionSet[]> = {};
  history.forEach(set => {
    const key = format(new Date(set.completedAt), 'yyyy-MM-dd HH:mm');
    if (!historyBySession[key]) historyBySession[key] = [];
    historyBySession[key].push(set);
  });

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">{exercise?.name}</h2>
        <p className="text-sm text-gray-500 font-medium">{exercise?.muscleGroup} • {exercise?.equipment}</p>
      </div>

      {history.length > 0 ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 flex flex-col items-center gap-1 text-center">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Máxima</span>
              <span className="text-sm font-black text-gray-900 dark:text-gray-100">{stats?.maxWeight}kg</span>
            </Card>
            <Card className="p-3 flex flex-col items-center gap-1 text-center">
              <Repeat size={16} className="text-blue-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Sessões</span>
              <span className="text-sm font-black text-gray-900 dark:text-gray-100">{stats?.totalSessions}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center gap-1 text-center">
              <Weight size={16} className="text-purple-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Volume</span>
              <span className="text-sm font-black text-gray-900 dark:text-gray-100">{Math.round((stats?.totalVolume || 0) / 1000)}t</span>
            </Card>
          </div>

          {/* Chart */}
          <Card className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">
                {view === 'weight' ? 'Progresso de Carga' : 'Progresso de Volume'}
              </h3>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setView('weight')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                    view === 'weight' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" : "text-gray-500"
                  )}
                >
                  CARGA
                </button>
                <button
                  onClick={() => setView('volume')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                    view === 'volume' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600" : "text-gray-500"
                  )}
                >
                  VOLUME
                </button>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#9ca3af' }}
                    domain={view === 'weight' ? ['dataMin - 5', 'dataMax + 5'] : ['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={view} 
                    stroke={view === 'weight' ? "#3b82f6" : "#8b5cf6"} 
                    strokeWidth={3} 
                    dot={{ fill: view === 'weight' ? "#3b82f6" : "#8b5cf6", r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* List */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">Sessões Anteriores</h3>
            {Object.entries(historyBySession).map(([dateStr, sessionSets]) => (
              <Card key={dateStr} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Calendar size={14} />
                    <span className="text-xs font-bold">
                      {format(new Date(dateStr), "d 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {sessionSets.length} séries
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sessionSets.map((set, idx) => (
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
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          illustration={<HistoryIllustration />}
          title="Nenhum histórico"
          description="Realize este exercício em um treino para começar a ver sua progressão aqui."
          actionLabel="Voltar"
          onAction={() => navigate(-1)}
        />
      )}
    </div>
  );
}
