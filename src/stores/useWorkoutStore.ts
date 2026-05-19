import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WorkoutState {
  activeSessionId: number | null;
  currentIndex: number;
  currentSet: number;
  isWarmup: boolean;
  restTimerSound: boolean;
  restTimerVibration: boolean;
  
  // Actions
  setActiveSession: (id: number | null) => void;
  setProgress: (index: number, set: number, isWarmup: boolean) => void;
  setRestTimerSettings: (sound: boolean, vibration: boolean) => void;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      activeSessionId: null,
      currentIndex: 0,
      currentSet: 1,
      isWarmup: true,
      restTimerSound: true,
      restTimerVibration: true,

      setActiveSession: (id) => set({ activeSessionId: id }),
      setProgress: (index, setNum, isWarmup) => set({ 
        currentIndex: index, 
        currentSet: setNum, 
        isWarmup 
      }),
      setRestTimerSettings: (sound, vibration) => set({
        restTimerSound: sound,
        restTimerVibration: vibration
      }),
      reset: () => set({ 
        activeSessionId: null, 
        currentIndex: 0, 
        currentSet: 1, 
        isWarmup: true 
      }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
