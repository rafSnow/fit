import { useState, useEffect, useRef, useMemo } from 'react';
import { useExercises } from '@/hooks/useExercises';
import type { Exercise } from '@/types/database';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { X, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExercisePickerProps {
  value?: number;
  onSelect: (exercise: Exercise | undefined) => void;
  label?: string;
  placeholder?: string;
  excludeId?: number;
  className?: string;
}

export function ExercisePicker({
  value,
  onSelect,
  label,
  placeholder = 'Buscar exercício...',
  excludeId,
  className
}: ExercisePickerProps) {
  const { exercises, getById } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [prevValue, setPrevValue] = useState(value);

  // Sync state with value prop during render
  if (value !== prevValue) {
    setPrevValue(value);
    if (!value) {
      setSelectedExercise(null);
      setSearchQuery('');
    }
  }

  // Load selected exercise if value changes
  useEffect(() => {
    if (value) {
      getById(value).then(ex => {
        if (ex) {
          setSelectedExercise(ex);
          setSearchQuery(ex.name);
        }
      });
    }
  }, [value, getById]);

  // Filter exercises based on search query
  const results = useMemo(() => {
    if (searchQuery.length > 1 && showDropdown && !selectedExercise) {
      return exercises.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        ex.id !== excludeId
      ).slice(0, 20);
    }
    return [];
  }, [searchQuery, exercises, excludeId, showDropdown, selectedExercise]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setSearchQuery(exercise.name);
    setShowDropdown(false);
    onSelect(exercise);
  };

  const handleClear = () => {
    setSelectedExercise(null);
    setSearchQuery('');
    onSelect(undefined);
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <div className="relative">
        <Input
          label={label}
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
            if (selectedExercise) {
              setSelectedExercise(null);
              onSelect(undefined);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
          className={cn(selectedExercise && "pr-10 font-medium text-blue-600 dark:text-blue-400")}
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <Card className="relative z-10 w-full mt-2 p-0 shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden">
          {results.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b last:border-0 border-gray-100 dark:border-gray-800"
              onClick={() => handleSelect(ex)}
            >
              <div className="flex items-center gap-2">
                <Dumbbell size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {ex.name}
                </span>
              </div>
              <div className="text-xs text-gray-500 ml-6">
                {ex.muscleGroup} • {ex.equipment}
              </div>
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}
