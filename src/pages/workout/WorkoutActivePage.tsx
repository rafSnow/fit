import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHeader } from '@/hooks/useHeader';
import { useRoutines } from '@/hooks/useRoutines';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AnimatedCheckmark } from '@/components/ui/AnimatedCheckmark';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { RestTimer } from '@/components/workout/RestTimer';
import { useToastStore } from '@/stores/useToastStore';
import { 
  Info, 
  HelpCircle, Repeat, CheckCircle2, XCircle,
  Dumbbell, Video, Zap
} from 'lucide-react';
import { extractYouTubeId, cn, hapticFeedback } from '@/lib/utils';
import { db } from '@/lib/db';
import type { Routine, RoutineExercise, Exercise, WorkoutSession } from '@/types/database';

const WorkoutActiveSkeleton = () => (
  <div className="p-4 space-y-8 animate-pulse">
    <div className="space-y-2">
      <div className="flex justify-between">
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
    
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
      
      <div className="h-20 w-full bg-gray-50 dark:bg-gray-900 rounded-xl" />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-gray-50 dark:bg-gray-900 rounded-2xl" />
        <div className="h-24 bg-gray-50 dark:bg-gray-900 rounded-2xl" />
      </div>
      
      <div className="h-16 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
    </Card>
    
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-14 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800" />
      ))}
    </div>
  </div>
);

export default function WorkoutActivePage() {
  const navigate = useNavigate();
  const { getById: getRoutineById } = useRoutines();
  const { getActiveSession, addSet, getLastWeightAndReps, updateSessionProgress } = useWorkoutSessions();
  const { addToast } = useToastStore();
  const { 
    currentIndex, currentSet, isWarmup, 
    setProgress, setActiveSession
  } = useWorkoutStore();

  // Session State
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineExercises, setRoutineExercises] = useState<(RoutineExercise & { exercise?: Exercise })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Flow State
  const [isResting, setIsResting] = useState(false);
  const [currentDropNum, setCurrentDropNum] = useState(0);
  const [showCheckmark, setShowCheckmark] = useState(false);

  // Form State
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [toFailure, setToFailure] = useState(false);

  // UI State
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSubstituteOpen, setIsSubstituteOpen] = useState(false);
  const [progressionDefaults, setProgressionDefaults] = useState({ compound: 2.5, isolation: 1.25 });

  // Header with timer
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinishWorkout = useCallback(async (confirm = false) => {
    if (!session) return;
    if (confirm && !window.confirm('Deseja realmente finalizar o treino agora?')) return;
    
    hapticFeedback.workoutComplete();
    navigate(`/workout/summary/${session.id}`);
  }, [session, navigate]);

  const headerActions = useMemo(() => (
    <Button variant="ghost" size="sm" onClick={() => handleFinishWorkout(true)} className="text-red-500 font-bold">
      Finalizar
    </Button>
  ), [handleFinishWorkout]);

  useHeader(
    routine ? `${routine.name} · ${formatTime(elapsedTime)}` : 'Treino Ativo',
    headerActions
  );

  // Load Progression Defaults
  useEffect(() => {
    const loadDefaults = async () => {
      const c = await db.settings.get('compoundIncrement');
      const i = await db.settings.get('isolationIncrement');
      setProgressionDefaults({
        compound: (c?.value as number) ?? 2.5,
        isolation: (i?.value as number) ?? 1.25
      });
    };
    loadDefaults();
  }, []);

  // Wake Lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request('screen');
        } catch (err) {
          if (err instanceof Error) {
            console.error(`${err.name}, ${err.message}`);
          } else {
            console.error('Wake lock error:', err);
          }
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const start = new Date(session.startedAt).getTime();
      const now = new Date().getTime();
      setElapsedTime(Math.floor((now - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const loadHistoricalData = useCallback(async (exerciseId: number, re: RoutineExercise) => {
    const history = await getLastWeightAndReps(exerciseId);
    if (history) {
      setWeight(history.weight.toString());
      setReps(history.reps.toString());
    } else {
      setWeight(re.initialWeight?.toString() || '');
      setReps(re.repsTarget.split('-')[0] || '10');
    }
  }, [getLastWeightAndReps]);

  // Load Session Data
  useEffect(() => {
    const loadSession = async () => {
      const active = await getActiveSession();
      if (!active) {
        navigate('/workout');
        return;
      }
      setSession(active);
      setActiveSession(active.id!);

      const routineData = await getRoutineById(active.routineId);
      if (routineData) {
        setRoutine(routineData);
        setRoutineExercises(routineData.exercises as (RoutineExercise & { exercise?: Exercise })[]);
        
        // Restore progress
        const idx = active.currentExerciseIndex ?? 0;
        const sNum = active.currentSetNumber ?? 1;
        const warmup = active.isWarmup ?? true;
        
        setProgress(idx, sNum, warmup);
        
        const currentRE = routineData.exercises[idx];
        if (currentRE) {
          loadHistoricalData(currentRE.exerciseId, currentRE);
        }
      }
      setIsLoading(false);
    };
    loadSession();
  }, [getActiveSession, getRoutineById, loadHistoricalData, navigate, setActiveSession, setProgress]);

  // Sync with IndexedDB
  useEffect(() => {
    if (!session?.id || isLoading) return;
    
    updateSessionProgress(session.id, {
      currentExerciseIndex: currentIndex,
      currentSetNumber: currentSet,
      isWarmup
    });
  }, [currentIndex, currentSet, isWarmup, session?.id, isLoading, updateSessionProgress]);

  const currentRE = routineExercises[currentIndex];
  const progress = routineExercises.length > 0 ? ((currentIndex + 1) / routineExercises.length) * 100 : 0;

  const advanceFlow = useCallback(() => {
    if (!currentRE) return;

    if (isWarmup) {
      if (currentSet < (currentRE.warmupSets || 0)) {
        setProgress(currentIndex, currentSet + 1, true);
      } else {
        // Transition to first work set
        setProgress(currentIndex, 1, false);
      }
    } else {
      const isSupersetA = currentRE.technique === 'Superset' || currentRE.technique === 'Bi-set';
      const prevRE = routineExercises[currentIndex - 1];
      const isSupersetB = prevRE?.technique === 'Superset' || prevRE?.technique === 'Bi-set';

      if (isSupersetA) {
        // Move to Exercise B, same set number
        const nextIdx = currentIndex + 1;
        const nextRE = routineExercises[nextIdx];
        if (nextRE) {
          setProgress(nextIdx, currentSet, (nextRE.warmupSets || 0) > 0 && currentSet === 1); 
          loadHistoricalData(nextRE.exerciseId, nextRE);
        } else {
          handleFinishWorkout();
        }
      } else if (isSupersetB) {
        // Move back to Exercise A for the next set, or move forward to next exercise
        if (currentSet < prevRE.workSets) {
          const prevIdx = currentIndex - 1;
          const prevExerciseRE = routineExercises[prevIdx];
          setProgress(prevIdx, currentSet + 1, false);
          loadHistoricalData(prevExerciseRE.exerciseId, prevExerciseRE);
        } else {
          // Move to exercise after B
          if (currentIndex < routineExercises.length - 1) {
            const nextIdx = currentIndex + 1;
            const nextRE = routineExercises[nextIdx];
            setProgress(nextIdx, 1, (nextRE.warmupSets || 0) > 0);
            loadHistoricalData(nextRE.exerciseId, nextRE);
            addToast(`Próximo: ${nextRE.exercise?.name}`);
          } else {
            handleFinishWorkout();
          }
        }
      } else {
        // Normal Flow
        if (currentSet < currentRE.workSets) {
          setProgress(currentIndex, currentSet + 1, false);
        } else {
          // Move to next exercise
          if (currentIndex < routineExercises.length - 1) {
            const nextIdx = currentIndex + 1;
            const nextRE = routineExercises[nextIdx];
            
            setProgress(nextIdx, 1, (nextRE.warmupSets || 0) > 0);
            loadHistoricalData(nextRE.exerciseId, nextRE);
            addToast(`Próximo: ${nextRE.exercise?.name}`);
          } else {
            handleFinishWorkout();
          }
        }
      }
    }
  }, [currentIndex, currentSet, isWarmup, currentRE, routineExercises, setProgress, loadHistoricalData, handleFinishWorkout, addToast]);

  const onRestComplete = useCallback(() => {
    setIsResting(false);
    advanceFlow();
  }, [advanceFlow]);

  const handleNextSet = useCallback(async () => {
    if (!session || !currentRE) return;

    // Show checkmark
    setShowCheckmark(true);
    setTimeout(() => setShowCheckmark(false), 1000);

    // Record the set
    await addSet({
      sessionId: session.id!,
      exerciseId: currentRE.exerciseId,
      setType: currentDropNum > 0 ? 'drop' : (isWarmup ? 'warmup' : 'work'),
      setNumber: currentDropNum > 0 ? currentDropNum : currentSet,
      weightKg: Number(weight),
      reps: Number(reps),
      toFailure,
    });

    // Reset temporary states
    setToFailure(false);

    // 1. Handle Drop Sets (Special Mode)
    const hasDropSets = currentRE.technique === 'Drop Set' && (currentRE.dropNum || 0) > 0;
    const isLastDrop = currentDropNum === (currentRE.dropNum || 0);

    if (currentDropNum > 0) {
      if (isLastDrop) {
        setCurrentDropNum(0);
        const isLastExercise = currentIndex === routineExercises.length - 1;
        if (isLastExercise) {
          handleFinishWorkout();
        } else {
          setIsResting(true);
        }
      } else {
        // Next drop
        const nextDropNum = currentDropNum + 1;
        setCurrentDropNum(nextDropNum);
        
        // Suggest reduced weight for next drop
        const currentWeight = Number(weight);
        const reduction = (currentRE.dropDecPct || 20) / 100;
        const suggestedWeight = Math.round(currentWeight * (1 - reduction) * 2) / 2;
        setWeight(suggestedWeight.toString());
      }
      return;
    }

    // 2. Determine if we finished the current "phase" (Warmup or Work)
    const isLastWarmupSet = isWarmup && currentSet === (currentRE.warmupSets || 0);
    const isLastWorkSet = !isWarmup && currentSet === currentRE.workSets;
    
    // 3. Haptic Feedback
    if (isLastWorkSet && currentIndex === routineExercises.length - 1) {
      hapticFeedback.workoutComplete();
    } else if (isLastWorkSet || isLastWarmupSet) {
      hapticFeedback.success();
    } else {
      hapticFeedback.light();
    }

    // 4. Transition Logic
    if (isWarmup) {
      if (isLastWarmupSet) {
        // Move to work sets
        advanceFlow();
      } else {
        // Next warmup set
        advanceFlow();
      }
    } else {
      // We are in Work Sets
      if (isLastWorkSet) {
        if (hasDropSets) {
          // Enter Drop Set Mode
          setCurrentDropNum(1);
          const currentWeight = Number(weight);
          const reduction = (currentRE.dropDecPct || 20) / 100;
          const suggestedWeight = Math.round(currentWeight * (1 - reduction) * 2) / 2;
          setWeight(suggestedWeight.toString());
          addToast('Drop Set!', 'info');
        } else {
          // Finished exercise
          const isLastExercise = currentIndex === routineExercises.length - 1;
          if (isLastExercise) {
            handleFinishWorkout();
          } else {
            setIsResting(true);
          }
        }
      } else {
        // Next work set
        const isSupersetA = currentRE.technique === 'Superset' || currentRE.technique === 'Bi-set';
        if (isSupersetA) {
          advanceFlow();
        } else {
          setIsResting(true);
        }
      }
    }
  }, [session, currentRE, currentDropNum, isWarmup, currentSet, weight, reps, toFailure, currentIndex, routineExercises, addSet, handleFinishWorkout, advanceFlow, addToast]);

  const handleSkipExercise = () => {
    if (!window.confirm('Deseja pular este exercício? As séries não realizadas não serão registradas.')) return;

    if (currentIndex < routineExercises.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextRE = routineExercises[nextIdx];
      
      setProgress(nextIdx, 1, (nextRE.warmupSets || 0) > 0);
      loadHistoricalData(nextRE.exerciseId, nextRE);
      addToast(`Próximo: ${nextRE.exercise?.name}`);
    } else {
      handleFinishWorkout();
    }
  };

  const handleAcceptProgression = async () => {
    if (!currentRE || !currentRE.id) return;
    
    const exercise = currentRE.exercise;
    const isCompound = exercise ? [
      'Supino', 'Agachamento', 'Levantamento terra', 'Desenvolvimento', 
      'Remada curvada', 'Leg press', 'Puxada', 'Stiff'
    ].some(name => exercise.name.includes(name)) : true;
    
    const fallback = isCompound ? progressionDefaults.compound : progressionDefaults.isolation;
    const newWeight = Number(weight) + (currentRE.weightIncrement || fallback);
    setWeight(newWeight.toString());
    
    // Clear the suggestion
    await db.routineExercises.update(currentRE.id, { progressionSuggested: false });
    
    // Update local state to hide the banner
    const newREs = [...routineExercises];
    newREs[currentIndex] = { ...newREs[currentIndex], progressionSuggested: false };
    setRoutineExercises(newREs);
    
    addToast('Peso atualizado! Bons ganhos! 💪', 'success');
  };

  const handleIgnoreProgression = async () => {
    if (!currentRE || !currentRE.id) return;
    await db.routineExercises.update(currentRE.id, { progressionSuggested: false });
    
    const newREs = [...routineExercises];
    newREs[currentIndex] = { ...newREs[currentIndex], progressionSuggested: false };
    setRoutineExercises(newREs);
  };

  if (isLoading || !currentRE) {
    return <WorkoutActiveSkeleton />;
  }

  const youtubeId = currentRE.exercise?.youtubeUrl ? extractYouTubeId(currentRE.exercise.youtubeUrl) : null;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 relative">
      <AnimatePresence>
        {showCheckmark && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-sm dark:bg-black/20"
          >
            <AnimatedCheckmark size={120} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs font-medium text-gray-500">
          <span>Exercício {currentIndex + 1} de {routineExercises.length}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isResting ? (
        <RestTimer 
          initialSeconds={currentRE.restSeconds} 
          onComplete={onRestComplete} 
          onSkip={onRestComplete}
        />
      ) : (
        <>
          {/* Progression Suggestion Banner */}
          {currentRE.progressionSuggested && !isWarmup && (
            <Card className="p-4 bg-emerald-600 border-none shadow-lg animate-in slide-in-from-top duration-500 overflow-hidden relative">
              <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Zap size={20} className="text-white fill-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-black text-sm uppercase tracking-wider">Sugestão de Carga</span>
                    <span className="text-emerald-100 text-xs font-medium">
                      Aumente para <b>{Number(weight) + (currentRE.weightIncrement || (
                        currentRE.exercise && [
                          'Supino', 'Agachamento', 'Levantamento terra', 'Desenvolvimento', 
                          'Remada curvada', 'Leg press', 'Puxada', 'Stiff'
                        ].some(name => currentRE.exercise!.name.includes(name)) 
                          ? progressionDefaults.compound 
                          : progressionDefaults.isolation
                      ))} kg</b>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleIgnoreProgression}
                    className="p-2 text-white/60 hover:text-white transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                  <Button 
                    onClick={handleAcceptProgression}
                    size="sm" 
                    className="bg-white text-emerald-700 hover:bg-emerald-50 border-none font-bold"
                  >
                    Aceitar
                  </Button>
                </div>
              </div>
              {/* Background Decor */}
              <Zap size={80} className="absolute -right-4 -bottom-4 text-white/10 -rotate-12" />
            </Card>
          )}

          {/* Main Exercise Card */}
          <Card className={cn(
            "p-6 flex flex-col gap-6 shadow-md border-blue-100 dark:border-blue-900/30 transition-colors",
            currentDropNum > 0 && "bg-blue-50 dark:bg-blue-900/10 border-blue-200",
            (currentRE.technique === 'Superset' || currentRE.technique === 'Bi-set') && "border-l-4 border-l-orange-500",
            (routineExercises[currentIndex - 1]?.technique === 'Superset' || routineExercises[currentIndex - 1]?.technique === 'Bi-set') && "border-l-4 border-l-orange-500"
          )}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <Badge variant={isWarmup ? 'outline' : 'default'}>
                  {isWarmup ? 'AQUECIMENTO' : 'SÉRIE DE TRABALHO'}
                </Badge>
                
                {currentDropNum > 0 && (
                  <Badge variant="secondary" className="bg-blue-600 text-white border-blue-700 gap-1">
                    <Zap size={10} fill="currentColor" />
                    DROP SET {currentDropNum} de {currentRE.dropNum}
                  </Badge>
                )}

                {currentRE.technique === 'Superset' && !isWarmup && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                    SUPERSET A
                  </Badge>
                )}
                {currentRE.technique === 'Bi-set' && !isWarmup && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                    BI-SET A
                  </Badge>
                )}
                {(routineExercises[currentIndex - 1]?.technique === 'Superset') && !isWarmup && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                    SUPERSET B
                  </Badge>
                )}
                {(routineExercises[currentIndex - 1]?.technique === 'Bi-set') && !isWarmup && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                    BI-SET B
                  </Badge>
                )}
              </div>

              {/* Combined Superset Header */}
              {((currentRE.technique === 'Superset' || currentRE.technique === 'Bi-set') || 
                (routineExercises[currentIndex - 1]?.technique === 'Superset' || routineExercises[currentIndex - 1]?.technique === 'Bi-set')) && !isWarmup && (
                <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-tighter mb-1">
                  {currentRE.technique === 'Superset' || routineExercises[currentIndex - 1]?.technique === 'Superset' ? 'SUPERSET' : 'BI-SET'}: {' '}
                  {currentRE.technique === 'Superset' || currentRE.technique === 'Bi-set' 
                    ? `${currentRE.exercise?.name} + ${routineExercises[currentIndex + 1]?.exercise?.name || '?'}`
                    : `${routineExercises[currentIndex - 1]?.exercise?.name || '?'} + ${currentRE.exercise?.name}`
                  }
                </div>
              )}

              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 leading-tight">
                {currentRE.exercise?.name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Dumbbell size={14} />
                <span>{currentRE.exercise?.muscleGroup}</span>
                <span>•</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Série {currentSet} de {isWarmup ? currentRE.warmupSets : currentRE.workSets}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">RPE Alvo</span>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100">{currentRE.rpe || '8'}</span>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Reps Alvo</span>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100">{currentRE.repsTarget}</span>
              </div>
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-800" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Descanso</span>
                <span className="text-xl font-black text-gray-900 dark:text-gray-100">{currentRE.restSeconds}s</span>
              </div>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Peso (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="w-full h-16 text-3xl font-black text-center rounded-2xl border-2 border-gray-100 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Reps</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full h-16 text-3xl font-black text-center rounded-2xl border-2 border-gray-100 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 focus:border-blue-500 focus:outline-none transition-colors"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                />
              </div>
            </div>

            {/* Main Action Button */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleNextSet}
                className="flex-1 h-16 text-lg font-black gap-2 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                <CheckCircle2 size={24} />
                {currentDropNum > 0 ? 'Confirmar Drop' : 'Série Concluída'}
              </Button>
              {currentDropNum > 0 ? (
                <button
                  onClick={() => {
                    setCurrentDropNum(0);
                    if (currentIndex === routineExercises.length - 1) {
                      handleFinishWorkout();
                    } else {
                      setIsResting(true);
                    }
                  }}
                  className="h-16 px-4 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-xs bg-white dark:bg-gray-900 dark:border-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Pular série de drop set"
                >
                  PULAR DROP
                </button>
              ) : (
                <button
                  onClick={() => setToFailure(!toFailure)}
                  aria-label={toFailure ? "Remover marcação de falha" : "Marcar série como até a falha"}
                  className={cn(
                    "h-16 w-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    toFailure 
                      ? "bg-red-50 border-red-500 text-red-600 shadow-sm" 
                      : "border-gray-100 text-gray-400 bg-gray-50 dark:bg-gray-900 dark:border-gray-800"
                  )}
                >
                  <Zap size={20} fill={toFailure ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold mt-1">FALHA</span>
                </button>
              )}
            </div>
          </Card>

          {/* Helper Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-col h-auto py-3 gap-1 border border-gray-100 dark:border-gray-800"
              onClick={() => setIsHelpOpen(true)}
            >
              <HelpCircle size={18} />
              <span className="text-[10px]">Ajuda</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-col h-auto py-3 gap-1 border border-gray-100 dark:border-gray-800"
              onClick={() => setIsSubstituteOpen(true)}
            >
              <Repeat size={18} />
              <span className="text-[10px]">Substituir</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-col h-auto py-3 gap-1 border border-gray-100 dark:border-gray-800"
              onClick={() => {
                if (currentRE.exercise?.sub1Id || currentRE.exercise?.sub2Id) {
                  navigate(`/exercises/${currentRE.exerciseId}`);
                } else {
                  addToast('Nenhuma substituição cadastrada', 'info');
                }
              }}
            >
              <Info size={18} />
              <span className="text-[10px]">Detalhes</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-col h-auto py-3 gap-1 border border-red-100 dark:border-red-900/30 text-red-500"
              onClick={handleSkipExercise}
            >
              <XCircle size={18} />
              <span className="text-[10px]">Pular Exercício</span>
            </Button>
          </div>
        </>
      )}

      {/* Help BottomSheet */}
      <BottomSheet 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)}
        title="Ajuda do Exercício"
      >
        <div className="flex flex-col gap-4 pb-8">
          {youtubeId ? (
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative group">
              <img 
                src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} 
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => window.open(currentRE.exercise?.youtubeUrl, '_blank')}
                className="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <div className="bg-white p-3 rounded-full">
                  <Video size={32} className="text-red-600" />
                </div>
              </button>
            </div>
          ) : (
            <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-xl text-center text-gray-500">
              <Video size={48} className="mx-auto mb-2 opacity-20" />
              <p>Nenhum vídeo disponível para este exercício.</p>
            </div>
          )}
          
          <div className="space-y-2">
            <h4 className="font-bold flex items-center gap-2">
              <Info size={16} className="text-blue-500" />
              Notas de Execução
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap italic">
              {currentRE.notes || currentRE.exercise?.notes || 'Nenhuma nota disponível.'}
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* Substitute BottomSheet */}
      <BottomSheet
        isOpen={isSubstituteOpen}
        onClose={() => setIsSubstituteOpen(false)}
        title="Substituir Exercício"
      >
        <div className="pb-8 space-y-4">
          <p className="text-sm text-gray-500">
            Escolha um exercício para substituir "{currentRE.exercise?.name}" apenas nesta sessão.
          </p>
          <ExercisePicker 
            onSelect={(ex) => {
              if (ex) {
                const newREs = [...routineExercises];
                newREs[currentIndex] = { ...newREs[currentIndex], exerciseId: ex.id!, exercise: ex };
                setRoutineExercises(newREs);
                setIsSubstituteOpen(false);
                addToast(`Substituído por: ${ex.name}`);
              }
            }}
          />
        </div>
      </BottomSheet>
    </div>
  );
}
