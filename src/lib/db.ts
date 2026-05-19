import Dexie, { type Table } from 'dexie';
import type {
  Exercise,
  Routine,
  RoutineExercise,
  WorkoutSession,
  SessionSet,
  CardioSession,
  BodyMetrics,
  ProgressPhoto,
  Setting
} from '../types/database';

export class FitnessDB extends Dexie {
  exercises!: Table<Exercise>;
  routines!: Table<Routine>;
  routineExercises!: Table<RoutineExercise>;
  workoutSessions!: Table<WorkoutSession>;
  sessionSets!: Table<SessionSet>;
  cardioSessions!: Table<CardioSession>;
  bodyMetrics!: Table<BodyMetrics>;
  progressPhotos!: Table<ProgressPhoto>;
  settings!: Table<Setting>;

  constructor() {
    super('FitnessPWA');
    this.version(1).stores({
      exercises: '++id, name, muscleGroup, isCustom',
      routines: '++id, name, isActive',
      routineExercises: '++id, routineId, exerciseId, order',
      workoutSessions: '++id, routineId, startedAt',
      sessionSets: '++id, sessionId, exerciseId, completedAt',
      cardioSessions: '++id, type, date',
      bodyMetrics: '++id, date',
      progressPhotos: '++id, date',
      settings: 'key'
    });
  }
}

export const db = new FitnessDB();

const handleDBError = (error: unknown) => {
  console.error('Database Error:', error);
  if (error instanceof Dexie.DexieError) {
    if (error.name === 'QuotaExceededError') {
      throw new Error('Armazenamento cheio. Libere espaço no seu dispositivo.');
    }
    if (error.name === 'ConstraintError') {
      throw new Error('Já existe um registro com estes dados.');
    }
    if (error.name === 'DatabaseClosedError') {
      throw new Error('O banco de dados foi fechado inesperadamente. Recarregue a página.');
    }
    throw new Error(`Erro de banco de dados: ${error.message}`);
  }
  throw error;
};

// Helper CRUD functions
export const crud = {
  async getAll<T>(table: Table<T>) {
    try {
      return await table.toArray();
    } catch (error) {
      return handleDBError(error);
    }
  },
  async getById<T>(table: Table<T>, id: number | string) {
    try {
      return await table.get(id);
    } catch (error) {
      return handleDBError(error);
    }
  },
  async add<T>(table: Table<T>, data: T) {
    try {
      return await table.add(data);
    } catch (error) {
      return handleDBError(error);
    }
  },
  async update<T>(table: Table<T>, id: number | string, data: Partial<T>) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await table.update(id, data as any);
      if (result === 0) throw new Error('Registro não encontrado para atualização.');
      return result;
    } catch (error) {
      return handleDBError(error);
    }
  },
  async delete<T>(table: Table<T>, id: number | string) {
    try {
      return await table.delete(id);
    } catch (error) {
      return handleDBError(error);
    }
  }
};
