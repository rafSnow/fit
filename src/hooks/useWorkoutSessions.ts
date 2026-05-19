import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { SessionSet } from '@/types/database';
import { useCallback, useMemo } from 'react';

export function useWorkoutSessions() {
  const recentSessions = useLiveQuery(async () => {
    const sessions = await db.workoutSessions
      .orderBy('startedAt')
      .reverse()
      .limit(5)
      .toArray();

    // Enrich with routine name and duration
    return await Promise.all(
      sessions.map(async (session) => {
        const routine = await db.routines.get(session.routineId);
        return {
          ...session,
          routineName: routine?.name || 'Rotina excluída',
        };
      })
    );
  }, []);

  const createSession = useCallback(async (routineId: number) => {
    return await db.workoutSessions.add({
      routineId,
      startedAt: new Date(),
    });
  }, []);

  const getActiveSession = useCallback(async () => {
    // Get latest session that hasn't finished
    const session = await db.workoutSessions
      .orderBy('startedAt')
      .reverse()
      .filter(s => !s.finishedAt)
      .first();
    return session || null;
  }, []);

  const getSessionById = useCallback(async (id: number) => {
    return await db.workoutSessions.get(id);
  }, []);

  const finishSession = useCallback(async (id: number, notes?: string) => {
    const session = await db.workoutSessions.get(id);
    if (!session) return;

    const finishedAt = new Date();
    const durationSeconds = Math.floor((finishedAt.getTime() - session.startedAt.getTime()) / 1000);

    // Progression Algorithm
    const sets = await db.sessionSets.where('sessionId').equals(id).toArray();
    const routineExercises = await db.routineExercises.where('routineId').equals(session.routineId).toArray();

    for (const re of routineExercises) {
      const exerciseSets = sets.filter(s => s.exerciseId === re.exerciseId && s.setType === 'work');
      
      if (exerciseSets.length === re.workSets) {
        // Parse target reps (e.g., "10" or "8-12")
        const targetReps = re.repsTarget.includes('-') 
          ? parseInt(re.repsTarget.split('-')[1]) // Use upper bound for range
          : parseInt(re.repsTarget);

        const allSetsCompleted = exerciseSets.every(s => s.reps >= targetReps);

        if (allSetsCompleted) {
          // Determine default increment if not set
          let increment = re.weightIncrement;
          if (increment === undefined) {
            const compoundSetting = await db.settings.get('compoundIncrement');
            const isolationSetting = await db.settings.get('isolationIncrement');
            const defaultCompound = compoundSetting ? (compoundSetting.value as number) : 2.5;
            const defaultIsolation = isolationSetting ? (isolationSetting.value as number) : 1.25;

            const exercise = await db.exercises.get(re.exerciseId);
            const isCompound = exercise ? [
              'Supino', 'Agachamento', 'Levantamento terra', 'Desenvolvimento', 
              'Remada curvada', 'Leg press', 'Puxada', 'Stiff'
            ].some(name => exercise.name.includes(name)) : true;
            
            increment = isCompound ? defaultCompound : defaultIsolation;
          }

          await db.routineExercises.update(re.id!, { 
            progressionSuggested: true,
            weightIncrement: increment
          });
        }
      }
    }

    return await db.workoutSessions.update(id, {
      finishedAt,
      durationSeconds,
      notes
    });
  }, []);

  const addSet = useCallback(async (setData: Omit<SessionSet, 'id' | 'completedAt'>) => {
    return await db.sessionSets.add({
      ...setData,
      completedAt: new Date(),
    });
  }, []);

  const getSessionSets = useCallback(async (sessionId: number) => {
    return await db.sessionSets
      .where('sessionId')
      .equals(sessionId)
      .toArray();
  }, []);

  const updateSessionProgress = useCallback(async (id: number, progress: { currentExerciseIndex: number; currentSetNumber: number; isWarmup: boolean }) => {
    return await db.workoutSessions.update(id, progress);
  }, []);

  const deleteSession = useCallback(async (id: number) => {
    await db.sessionSets.where('sessionId').equals(id).delete();
    return await db.workoutSessions.delete(id);
  }, []);

  const getSetHistory = useCallback(async (exerciseId: number) => {
    return await db.sessionSets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .limit(10)
      .toArray();
  }, []);

  const getLastWeightAndReps = useCallback(async (exerciseId: number) => {
    const lastSet = await db.sessionSets
      .where('exerciseId')
      .equals(exerciseId)
      .reverse()
      .first();
    return lastSet ? { weight: lastSet.weightKg, reps: lastSet.reps } : null;
  }, []);

  return useMemo(() => ({
    recentSessions: recentSessions || [],
    isLoading: recentSessions === undefined,
    createSession,
    getActiveSession,
    getSessionById,
    finishSession,
    addSet,
    getSessionSets,
    updateSessionProgress,
    deleteSession,
    getSetHistory,
    getLastWeightAndReps,
  }), [
    recentSessions,
    createSession,
    getActiveSession,
    getSessionById,
    finishSession,
    addSet,
    getSessionSets,
    updateSessionProgress,
    deleteSession,
    getSetHistory,
    getLastWeightAndReps
  ]);
}
