import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { playBeep, cn } from '@/lib/utils';
import { Timer, SkipForward, Plus, Minus, Bell, BellOff, Vibrate } from 'lucide-react';

interface RestTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export const RestTimer = ({ initialSeconds, onComplete, onSkip }: RestTimerProps) => {
  const { restTimerSound, restTimerVibration, setRestTimerSettings } = useWorkoutStore();
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [totalDuration, setTotalDuration] = useState(initialSeconds);
  const [isFinished, setIsFinished] = useState(false);
  // Use a ref to track the last initialSeconds to avoid render-phase state updates
  useEffect(() => {
    console.log('RestTimer: initialSeconds changed to', initialSeconds);
    setSecondsRemaining(initialSeconds);
    setTotalDuration(initialSeconds);
    setIsFinished(false);
  }, [initialSeconds]);

  const handleTimerEnd = useCallback(() => {
    console.log('RestTimer: Timer ended');
    setIsFinished(true);
    
    // Alerts
    if (restTimerSound) {
      playBeep();
    }
    if (restTimerVibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Small delay before auto-advancing to show the "Finished" state
    const timeoutId = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [restTimerSound, restTimerVibration, onComplete]);

  useEffect(() => {
    console.log('RestTimer: Attempting to start interval. isFinished:', isFinished);
    if (isFinished) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          console.log('RestTimer: Interval reached 0');
          clearInterval(timer);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log('RestTimer: Cleaning up interval');
      clearInterval(timer);
    };
  }, [isFinished, handleTimerEnd]);

  const handleAdjust = (amount: number) => {
    if (isFinished) return;
    setSecondsRemaining((prev) => Math.max(0, prev + amount));
    if (amount > 0) {
      setTotalDuration((prev) => prev + amount);
    }
  };

  const progress = isFinished ? 0 : (secondsRemaining / totalDuration);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <Card 
      className={cn(
        "p-6 flex flex-col items-center gap-6 shadow-xl transition-colors duration-500",
        isFinished 
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" 
          : "border-blue-100 dark:border-blue-900/30",
        secondsRemaining > 0 && secondsRemaining <= 5 && "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 animate-pulse"
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px]">
          <Timer size={16} />
          Descanso
        </div>
        
        {/* Toggle Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setRestTimerSettings(!restTimerSound, restTimerVibration)}
            aria-label={restTimerSound ? "Desativar som do timer" : "Ativar som do timer"}
            aria-pressed={restTimerSound}
            className={cn(
              "p-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              restTimerSound ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30" : "text-gray-400 bg-gray-100 dark:bg-gray-800"
            )}
          >
            {restTimerSound ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
          <button 
            onClick={() => setRestTimerSettings(restTimerSound, !restTimerVibration)}
            aria-label={restTimerVibration ? "Desativar vibração do timer" : "Ativar vibração do timer"}
            aria-pressed={restTimerVibration}
            className={cn(
              "p-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              restTimerVibration ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30" : "text-gray-400 bg-gray-100 dark:bg-gray-800"
            )}
          >
            <Vibrate size={16} className={cn(restTimerVibration && "animate-bounce")} />
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        {/* SVG Progress Circle */}
        <svg className="w-48 h-48 transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-100 dark:text-gray-800"
          />
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - progress) }}
            transition={{ duration: 1, ease: "linear" }}
            strokeLinecap="round"
            className={cn(
              "transition-colors duration-300",
              isFinished ? "text-emerald-500" : "text-blue-500",
              secondsRemaining <= 5 && !isFinished && "text-red-500"
            )}
          />
        </svg>
        
        {/* Countdown Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-6xl font-black tabular-nums transition-colors",
            isFinished ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-100",
            secondsRemaining <= 5 && !isFinished && "text-red-600 dark:text-red-400"
          )}>
            {isFinished ? "0" : secondsRemaining}s
          </span>
          {isFinished && (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm animate-bounce">
              PRONTO!
            </span>
          )}
        </div>
      </div>

      {/* Adjust Buttons */}
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleAdjust(-15)}
          className="h-12 w-12 rounded-full p-0 border-gray-200"
          disabled={isFinished}
        >
          <Minus size={18} />
          <span className="sr-only">-15s</span>
          <span className="absolute -bottom-6 text-[10px] font-bold text-gray-400">-15s</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleAdjust(15)}
          className="h-12 w-12 rounded-full p-0 border-gray-200"
          disabled={isFinished}
        >
          <Plus size={18} />
          <span className="sr-only">+15s</span>
          <span className="absolute -bottom-6 text-[10px] font-bold text-gray-400">+15s</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleAdjust(30)}
          className="h-12 w-12 rounded-full p-0 border-gray-200"
          disabled={isFinished}
        >
          <Plus size={18} />
          <span className="sr-only">+30s</span>
          <span className="absolute -bottom-6 text-[10px] font-bold text-gray-400">+30s</span>
        </Button>
      </div>

      <Button 
        onClick={onSkip}
        variant={isFinished ? "primary" : "secondary"}
        className={cn(
          "w-full h-16 mt-4 font-black gap-2 transition-all",
          isFinished && "scale-105 shadow-lg shadow-emerald-200 dark:shadow-none bg-emerald-600 hover:bg-emerald-700"
        )}
      >
        <SkipForward size={20} />
        {isFinished ? "PRÓXIMA SÉRIE" : "Pular Descanso"}
      </Button>
    </Card>
  );
};
