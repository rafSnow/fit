export interface Exercise {
  id?: number;
  name: string;
  muscleGroup: string;
  secondaryMuscle?: string;
  equipment: string;
  sub1Id?: number;
  sub2Id?: number;
  youtubeUrl?: string;
  notes?: string;
  isCustom: boolean;
  createdAt: Date;
}

export interface Routine {
  id?: number;
  name: string;
  days: number[]; // 0-6 (Sun-Sat)
  isActive: boolean;
  createdAt: Date;
}

export interface RoutineExercise {
  id?: number;
  routineId: number;
  exerciseId: number;
  order: number;
  warmupSets: number;
  warmupWeightPct?: number[]; // Percentagens por série
  warmupReps?: number[]; // Reps sugeridas por série
  workSets: number;
  repsTarget: string; // "10" ou "8-12"
  initialWeight?: number;
  restSeconds: number;
  rpe?: number;
  technique: 'Normal' | 'Drop Set' | 'Superset' | 'Bi-set';
  supersetWith?: number; // exerciseId
  dropNum?: number;
  dropDecPct?: number;
  notes?: string;
  progressionSuggested?: boolean;
  weightIncrement?: number;
}

export interface WorkoutSession {
  id?: number;
  routineId: number;
  startedAt: Date;
  finishedAt?: Date;
  durationSeconds?: number;
  notes?: string;
  currentExerciseIndex?: number;
  currentSetNumber?: number;
  isWarmup?: boolean;
}

export interface SessionSet {
  id?: number;
  sessionId: number;
  exerciseId: number;
  setType: 'warmup' | 'work' | 'drop';
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  toFailure: boolean;
  completedAt: Date;
}

export interface CardioSession {
  id?: number;
  type: 'Corrida' | 'Esteira' | 'Bicicleta' | 'Escada';
  date: Date;
  durationSeconds: number;
  distanceKm?: number;
  calories: number;
  avgSpeed?: number;
  incline?: number;
  heartRate?: number;
  rpe?: number;
  notes?: string;
}

export interface BodyMetrics {
  id?: number;
  date: Date;
  weightKg: number;
  heightCm: number;
  neck?: number;
  shoulders?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  armRelaxed?: number;
  armFlexed?: number;
  forearm?: number;
  thigh?: number;
  calf?: number;
  bodyFatPct?: number;
  notes?: string;
}

export interface ProgressPhoto {
  id?: number;
  date: Date;
  weightKg?: number;
  photoBlob: Blob;
  notes?: string;
}

export interface Setting {
  key: string;
  value: unknown;
}
