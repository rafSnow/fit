import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Routine, RoutineExercise } from '@/types/database';
import { useCallback, useMemo } from 'react';

export function useRoutines() {
  const routines = useLiveQuery(async () => {
    const allRoutines = await db.routines.toArray();
    
    // Enrich routines with exercise count
    const enrichedRoutines = await Promise.all(
      allRoutines.map(async (routine) => {
        const exerciseCount = await db.routineExercises
          .where('routineId')
          .equals(routine.id!)
          .count();
        return { ...routine, exerciseCount };
      })
    );
    
    return enrichedRoutines;
  }, []);

  const getAll = useCallback(async () => {
    return await db.routines.toArray();
  }, []);

  const getExercisesForRoutine = useCallback(async (routineId: number) => {
    const routineExercises = await db.routineExercises
      .where('routineId')
      .equals(routineId)
      .sortBy('order');

    // Enrich with exercise details
    return await Promise.all(
      routineExercises.map(async (re) => {
        const exercise = await db.exercises.get(re.exerciseId);
        return { ...re, exercise };
      })
    );
  }, []);

  const getById = useCallback(async (id: number) => {
    const routine = await db.routines.get(id);
    if (!routine) return null;

    const exercises = await getExercisesForRoutine(id);

    return { ...routine, exercises };
  }, [getExercisesForRoutine]);

  const getForToday = useCallback(async () => {
    const today = new Date().getDay(); // 0-6
    
    // Check workout schedule in settings first
    const scheduleSetting = await db.settings.get('workoutSchedule');
    if (scheduleSetting && (scheduleSetting.value as Record<number, number>)[today]) {
      const routineId = (scheduleSetting.value as Record<number, number>)[today];
      const routine = await db.routines.get(routineId);
      if (routine) return [routine];
    }

    const activeRoutines = await db.routines
      .where('isActive')
      .equals(1) 
      .toArray();
    
    // Some browsers/Dexie versions might store as 1/0 or true/false
    const allActive = activeRoutines.length > 0 ? activeRoutines : await db.routines.where('isActive').equals(1).toArray();
    
    return allActive.filter(r => r.days.includes(today));
  }, []);

  const create = useCallback(async (data: Omit<Routine, 'id' | 'createdAt'>) => {
    const id = await db.routines.add({
      ...data,
      createdAt: new Date(),
    });
    return id;
  }, []);

  const update = useCallback(async (id: number, data: Partial<Routine>) => {
    return await db.routines.update(id, data);
  }, []);

  const deleteRoutine = useCallback(async (id: number) => {
    return await db.transaction('rw', [db.routines, db.routineExercises], async () => {
      await db.routineExercises.where('routineId').equals(id).delete();
      await db.routines.delete(id);
    });
  }, []);

  const toggleActive = useCallback(async (id: number) => {
    const routine = await db.routines.get(id);
    if (routine) {
      await db.routines.update(id, { isActive: !routine.isActive });
    }
  }, []);

  const addExercise = useCallback(async (routineId: number, exerciseId: number) => {
    const count = await db.routineExercises.where('routineId').equals(routineId).count();
    return await db.routineExercises.add({
      routineId,
      exerciseId,
      order: count,
      warmupSets: 0,
      workSets: 3,
      repsTarget: '10',
      restSeconds: 90,
      technique: 'Normal'
    });
  }, []);

  const getRoutineExerciseById = useCallback(async (id: number) => {
    return await db.routineExercises.get(id);
  }, []);

  const updateExercise = useCallback(async (id: number, data: Partial<RoutineExercise>) => {
    return await db.routineExercises.update(id, data);
  }, []);

  const removeExercise = useCallback(async (id: number) => {
    return await db.routineExercises.delete(id);
  }, []);

  const reorderExercises = useCallback(async (_routineId: number, newOrderedIds: number[]) => {
    return await db.transaction('rw', db.routineExercises, async () => {
      for (let i = 0; i < newOrderedIds.length; i++) {
        await db.routineExercises.update(newOrderedIds[i], { order: i });
      }
    });
  }, []);

  return useMemo(() => ({
    routines: routines || [],
    isLoading: routines === undefined,
    getAll,
    getById,
    getForToday,
    getExercisesForRoutine,
    getRoutineExerciseById,
    create,
    update,
    delete: deleteRoutine,
    toggleActive,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
  }), [
    routines,
    getAll,
    getById,
    getForToday,
    getExercisesForRoutine,
    getRoutineExerciseById,
    create,
    update,
    deleteRoutine,
    toggleActive,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises
  ]);
}
