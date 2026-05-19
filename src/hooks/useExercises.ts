import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Exercise } from '@/types/database';
import { useCallback } from 'react';

export interface ExerciseFilters {
  muscleGroup?: string;
  equipment?: string;
  isCustom?: boolean;
}

export function useExercises() {
  // Reactive list of all exercises for convenience
  const exercises = useLiveQuery(() => db.exercises.toArray());

  /**
   * List exercises with optional filters
   */
  const getAll = useCallback(async (filters?: ExerciseFilters) => {
    let collection = db.exercises.toCollection();

    if (filters) {
      if (filters.muscleGroup) {
        collection = db.exercises.where('muscleGroup').equals(filters.muscleGroup);
      }
      
      if (filters.equipment) {
        collection = collection.filter(ex => ex.equipment === filters.equipment);
      }
      
      if (filters.isCustom !== undefined) {
        collection = collection.filter(ex => ex.isCustom === filters.isCustom);
      }
    }

    return await collection.toArray();
  }, []);

  /**
   * Get exercise by ID
   */
  const getById = useCallback(async (id: number) => {
    return await db.exercises.get(id);
  }, []);

  /**
   * Search exercises by name
   */
  const search = useCallback(async (query: string) => {
    if (!query) return await db.exercises.toArray();
    
    return await db.exercises
      .filter(ex => ex.name.toLowerCase().includes(query.toLowerCase()))
      .toArray();
  }, []);

  /**
   * Create a custom exercise
   */
  const create = useCallback(async (data: Omit<Exercise, 'id' | 'createdAt' | 'isCustom'>) => {
    const newExercise: Exercise = {
      ...data,
      isCustom: true,
      createdAt: new Date(),
    };
    return await db.exercises.add(newExercise);
  }, []);

  /**
   * Update a custom exercise
   */
  const update = useCallback(async (id: number, data: Partial<Exercise>) => {
    const exercise = await db.exercises.get(id);
    
    if (!exercise) {
      throw new Error('Exercise not found');
    }
    
    if (!exercise.isCustom) {
      throw new Error('Cannot update default exercises');
    }
    
    return await db.exercises.update(id, data);
  }, []);

  /**
   * Delete a custom exercise
   */
  const deleteExercise = useCallback(async (id: number) => {
    const exercise = await db.exercises.get(id);
    
    if (!exercise) {
      throw new Error('Exercise not found');
    }
    
    if (!exercise.isCustom) {
      throw new Error('Cannot delete default exercises');
    }
    
    return await db.exercises.delete(id);
  }, []);

  return {
    exercises: exercises || [],
    isLoading: exercises === undefined,
    getAll,
    getById,
    search,
    create,
    update,
    delete: deleteExercise,
  };
}
