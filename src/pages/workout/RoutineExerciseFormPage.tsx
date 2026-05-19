import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useRoutines } from '@/hooks/useRoutines';
import { useExercises } from '@/hooks/useExercises';
import { Stepper } from '@/components/ui/Stepper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { useToastStore } from '@/stores/useToastStore';
import { cn, hapticFeedback } from '@/lib/utils';
import { 
  ArrowLeft, Save, Info, Zap, Flame, 
  Timer, Target, Trash2, Dumbbell, TrendingUp
} from 'lucide-react';
import type { RoutineExercise, Exercise } from '@/types/database';

const REST_PRESETS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];

const TECHNIQUES = [
  { id: 'Normal', label: 'Normal', description: 'Séries convencionais' },
  { id: 'Drop Set', label: 'Drop Set', description: 'Redução de peso até falha' },
  { id: 'Superset', label: 'Superset', description: 'Dois exercícios sem descanso' },
  { id: 'Bi-set', label: 'Bi-set', description: 'Dois exercícios para o mesmo grupo' },
];

export default function RoutineExerciseFormPage() {
  const { routineId, reId } = useParams();
  const navigate = useNavigate();
  const { getRoutineExerciseById, updateExercise, removeExercise } = useRoutines();
  const { getById: getExerciseById } = useExercises();
  const { addToast } = useToastStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<RoutineExercise>>({
    warmupSets: 0,
    workSets: 3,
    repsTarget: '10',
    restSeconds: 90,
    technique: 'Normal',
    rpe: 8,
  });

  useHeader('Configurar Exercício', (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft size={20} />
    </Button>
  ));

  useEffect(() => {
    const loadData = async () => {
      if (!reId) return;
      const re = await getRoutineExerciseById(Number(reId));
      if (re) {
        setFormData(re);
        const ex = await getExerciseById(re.exerciseId);
        if (ex) setExercise(ex);
      }
      setIsLoading(false);
    };
    loadData();
  }, [reId, getExerciseById, getRoutineExerciseById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reId) return;

    if (!formData.repsTarget?.trim()) {
      setErrors({ repsTarget: 'As repetições alvo são obrigatórias.' });
      hapticFeedback.error();
      return;
    }

    if ((formData.technique === 'Superset' || formData.technique === 'Bi-set') && !formData.supersetWith) {
      addToast('Selecione um exercício parceiro para a técnica combinada.', 'error');
      hapticFeedback.error();
      return;
    }

    setIsSaving(true);
    try {
      await updateExercise(Number(reId), formData);
      addToast('Configuração salva!');
      hapticFeedback.success();
      navigate(`/routines/${routineId}`);
    } catch {
      hapticFeedback.error();
      addToast('Erro ao salvar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!reId) return;
    if (window.confirm('Remover este exercício da rotina?')) {
      await removeExercise(Number(reId));
      hapticFeedback.light();
      addToast('Exercício removido');
      navigate(`/routines/${routineId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 animate-pulse" />
          </div>
        </div>
        <div className="h-40 w-full bg-gray-200 animate-pulse" />
        <div className="h-60 w-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {exercise && (
        <div className="mb-6 flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Dumbbell size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{exercise.name}</h1>
            <p className="text-sm text-gray-500">{exercise.muscleGroup} • {exercise.equipment}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* Warmup Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-orange-500 font-semibold uppercase text-xs tracking-wider">
            <Flame size={16} />
            Séries de Aquecimento
          </div>
          <Card className="p-4 space-y-4">
            <Stepper 
              label="Número de Séries" 
              value={formData.warmupSets || 0} 
              onChange={(v) => {
                const newPct = [...(formData.warmupWeightPct || [])];
                const newReps = [...(formData.warmupReps || [])];
                if (v > (formData.warmupSets || 0)) {
                  for (let i = (formData.warmupSets || 0); i < v; i++) {
                    newPct[i] = i === 0 ? 50 : i === 1 ? 70 : 90;
                    newReps[i] = 10 - (i * 2);
                  }
                }
                setFormData({ 
                  ...formData, 
                  warmupSets: v,
                  warmupWeightPct: newPct.slice(0, v),
                  warmupReps: newReps.slice(0, v)
                });
              }}
              max={3}
            />
            {formData.warmupSets! > 0 && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-gray-400 uppercase">
                  <span>Série</span>
                  <span>% Carga</span>
                  <span>Reps</span>
                </div>
                {Array.from({ length: formData.warmupSets! }).map((_, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
                    <Input
                      type="number"
                      value={formData.warmupWeightPct?.[i] || ''}
                      onChange={(e) => {
                        const newPct = [...(formData.warmupWeightPct || [])];
                        newPct[i] = Number(e.target.value);
                        setFormData({ ...formData, warmupWeightPct: newPct });
                      }}
                      className="h-8 text-center"
                    />
                    <Input
                      type="number"
                      value={formData.warmupReps?.[i] || ''}
                      onChange={(e) => {
                        const newReps = [...(formData.warmupReps || [])];
                        newReps[i] = Number(e.target.value);
                        setFormData({ ...formData, warmupReps: newReps });
                      }}
                      className="h-8 text-center"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Work Sets Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-blue-500 font-semibold uppercase text-xs tracking-wider">
            <Target size={16} />
            Séries de Trabalho
          </div>
          <Card className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Stepper 
                label="Séries" 
                value={formData.workSets || 1} 
                onChange={(v) => setFormData({ ...formData, workSets: v })}
                min={1}
                max={10}
              />
              <Input
                label="Reps Alvo"
                placeholder="Ex: 10 ou 8-12"
                value={formData.repsTarget}
                onChange={(e) => {
                  setFormData({ ...formData, repsTarget: e.target.value });
                  if (errors.repsTarget) setErrors({ ...errors, repsTarget: '' });
                }}
                error={errors.repsTarget}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Carga Inicial (kg)"
                type="number"
                placeholder="0"
                value={formData.initialWeight || ''}
                onChange={(e) => setFormData({ ...formData, initialWeight: Number(e.target.value) })}
              />
              <Input
                label="Incremento (kg)"
                type="number"
                step="0.25"
                placeholder="Ex: 2.5"
                value={formData.weightIncrement || ''}
                onChange={(e) => setFormData({ ...formData, weightIncrement: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">RPE Alvo: {formData.rpe}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={formData.rpe || 8}
                  onChange={(e) => setFormData({ ...formData, rpe: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                />
              </div>
              <div className="flex items-center justify-center pt-6">
                {formData.progressionSuggested && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100 dark:border-green-900/30">
                    <TrendingUp size={12} />
                    Sugestão Ativa
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Timer size={16} />
                Tempo de Descanso: {formData.restSeconds}s
              </label>
              <div className="flex flex-wrap gap-2">
                {REST_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, restSeconds: preset.value })}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-semibold border transition-all",
                      formData.restSeconds === preset.value
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-500 hover:border-blue-300 dark:bg-gray-900 dark:border-gray-800"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
                <Input
                  type="number"
                  className="w-20 h-8 py-0 px-2 text-center"
                  placeholder="Personalizado"
                  value={formData.restSeconds}
                  onChange={(e) => setFormData({ ...formData, restSeconds: Number(e.target.value) })}
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Technique Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-purple-500 font-semibold uppercase text-xs tracking-wider">
            <Zap size={16} />
            Técnica Avançada
          </div>
          <div className="grid gap-3">
            {TECHNIQUES.map((tech) => (
              <button
                key={tech.id}
                type="button"
                onClick={() => setFormData({ ...formData, technique: tech.id as RoutineExercise['technique'] })}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                  formData.technique === tech.id
                    ? "bg-purple-50 border-purple-300 ring-1 ring-purple-300 dark:bg-purple-900/20"
                    : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800"
                )}
              >
                <div className={cn(
                  "mt-1 w-4 h-4 rounded-full border flex items-center justify-center",
                  formData.technique === tech.id ? "border-purple-600 bg-purple-600" : "border-gray-300"
                )}>
                  {formData.technique === tech.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <span className={cn(
                    "font-bold block",
                    formData.technique === tech.id ? "text-purple-700 dark:text-purple-400" : "text-gray-900 dark:text-gray-100"
                  )}>
                    {tech.label}
                  </span>
                  <span className="text-xs text-gray-500">{tech.description}</span>
                </div>
              </button>
            ))}
          </div>

          {(formData.technique === 'Superset' || formData.technique === 'Bi-set') && (
            <Card className="p-4 bg-purple-50/30 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30">
              <ExercisePicker
                label="Exercício Parceiro"
                value={formData.supersetWith}
                onSelect={(ex) => setFormData({ ...formData, supersetWith: ex?.id })}
                excludeId={exercise?.id}
                placeholder="Selecione o exercício..."
              />
            </Card>
          )}

          {formData.technique === 'Drop Set' && (
            <Card className="p-4 bg-purple-50/30 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30 grid grid-cols-2 gap-4">
              <Stepper 
                label="Número de Drops" 
                value={formData.dropNum || 1} 
                onChange={(v) => setFormData({ ...formData, dropNum: v })}
                min={1}
                max={5}
              />
              <Input
                label="% de Redução"
                type="number"
                placeholder="Ex: 20"
                value={formData.dropDecPct || 20}
                onChange={(e) => setFormData({ ...formData, dropDecPct: Number(e.target.value) })}
              />
            </Card>
          )}
        </section>

        {/* Notes */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-500 font-semibold uppercase text-xs tracking-wider">
            <Info size={16} />
            Notas Adicionais
          </div>
          <Textarea
            placeholder="Observações específicas para este exercício nesta rotina..."
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            maxLength={500}
          />
        </section>

        <div className="flex flex-col gap-3 pt-4">
          <Button type="submit" isLoading={isSaving} className="w-full py-6">
            {!isSaving && <Save size={18} className="mr-2" />}
            Salvar Configurações
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={isSaving}
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={18} className="mr-2" />
            Remover da Rotina
          </Button>
        </div>
      </form>
    </div>
  );
}
