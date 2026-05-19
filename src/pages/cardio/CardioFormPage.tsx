import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useHeader } from '@/hooks/useHeader';
import { useCardioSessions } from '@/hooks/useCardioSessions';
import { useToastStore } from '@/stores/useToastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn, calcAvgSpeed, hapticFeedback } from '@/lib/utils';

const cardioSchema = z.object({
  type: z.enum(['Corrida', 'Esteira', 'Bicicleta', 'Escada']),
  date: z.string(),
  durationMinutes: z.coerce.number().min(0),
  durationSeconds: z.coerce.number().min(0).max(59),
  distanceKm: z.coerce.number().optional(),
  calories: z.coerce.number().min(1, 'Obrigatório'),
  heartRate: z.coerce.number().optional(),
  rpe: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  incline: z.coerce.number().optional(),
  avgSpeed: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
  const totalSeconds = (data.durationMinutes * 60) + data.durationSeconds;
  if (totalSeconds <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Duração obrigatória',
      path: ['durationMinutes'],
    });
  }
  if (data.type !== 'Escada' && (!data.distanceKm || data.distanceKm <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Obrigatório para este tipo',
      path: ['distanceKm'],
    });
  }
});

interface CardioFormData {
  type: 'Corrida' | 'Esteira' | 'Bicicleta' | 'Escada';
  date: string;
  durationMinutes: number;
  durationSeconds: number;
  distanceKm?: number;
  calories: number;
  heartRate?: number;
  rpe?: number;
  notes?: string;
  incline?: number;
  avgSpeed?: number;
}

export default function CardioFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { createSession, getSessionById, updateSession } = useCardioSessions();
  const { addToast } = useToastStore();
  
  const [showOptional, setShowOptional] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);

  useHeader(isEdit ? 'Editar Cardio' : 'Novo Cardio');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CardioFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(cardioSchema) as any,
    defaultValues: {
      type: 'Corrida',
      date: new Date().toISOString().split('T')[0],
      durationMinutes: 0,
      durationSeconds: 0,
      rpe: 5,
    },
  });

  // Load data for editing
  useEffect(() => {
    if (isEdit) {
      const loadSession = async () => {
        const session = await getSessionById(Number(id));
        if (session) {
          reset({
            type: session.type,
            date: new Date(session.date).toISOString().split('T')[0],
            durationMinutes: Math.floor(session.durationSeconds / 60),
            durationSeconds: session.durationSeconds % 60,
            distanceKm: session.distanceKm,
            calories: session.calories,
            heartRate: session.heartRate,
            rpe: session.rpe,
            notes: session.notes,
            incline: session.incline,
            avgSpeed: session.avgSpeed,
          });
          if (session.heartRate || session.notes || session.incline || session.avgSpeed) {
            setShowOptional(true);
          }
        } else {
          addToast('Sessão não encontrada', 'error');
          navigate('/cardio');
        }
        setIsLoading(false);
      };
      loadSession();
    }
  }, [id, isEdit, getSessionById, reset, navigate, addToast]);

  const selectedType = watch('type');
  const durationMinutes = watch('durationMinutes');
  const durationSeconds = watch('durationSeconds');
  const distanceKm = watch('distanceKm');

  // Auto-calculate speed when distance or duration changes
  useEffect(() => {
    const totalSeconds = (Number(durationMinutes) * 60) + Number(durationSeconds);
    if (totalSeconds > 0 && distanceKm && distanceKm > 0) {
      const calculatedSpeed = calcAvgSpeed(distanceKm, totalSeconds);
      setValue('avgSpeed', Number(calculatedSpeed.toFixed(1)));
    }
  }, [durationMinutes, durationSeconds, distanceKm, setValue]);

  const onSubmit = async (data: CardioFormData) => {
    try {
      const totalSeconds = (Number(data.durationMinutes) * 60) + Number(data.durationSeconds);
      const sessionData = {
        type: data.type,
        date: new Date(data.date),
        durationSeconds: totalSeconds,
        distanceKm: data.distanceKm ? Number(data.distanceKm) : undefined,
        calories: Number(data.calories),
        heartRate: data.heartRate ? Number(data.heartRate) : undefined,
        rpe: data.rpe ? Number(data.rpe) : undefined,
        notes: data.notes,
        incline: data.incline ? Number(data.incline) : undefined,
        avgSpeed: data.avgSpeed ? Number(data.avgSpeed) : undefined,
      };

      if (isEdit) {
        await updateSession(Number(id), sessionData);
        addToast('Cardio atualizado com sucesso!', 'success');
        navigate(`/cardio/${id}`);
      } else {
        await createSession(sessionData);
        addToast('Cardio registrado com sucesso!', 'success');
        navigate('/cardio');
      }
    } catch {
      hapticFeedback.error();
      addToast('Erro ao salvar cardio.', 'error');
    }
  };

  const onInvalid = () => {
    hapticFeedback.error();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800" />)}
        </div>
        <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 rounded-md bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  const types = [
    { id: 'Corrida', label: 'Corrida', icon: '🏃' },
    { id: 'Esteira', label: 'Esteira', icon: '👟' },
    { id: 'Bicicleta', label: 'Bicicleta', icon: '🚴' },
    { id: 'Escada', label: 'Escada', icon: '🪜' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6 pb-12">
      {/* Type Selector */}
      <div className="grid grid-cols-2 gap-3">
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setValue('type', type.id as CardioFormData['type'])}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all active:scale-95',
              selectedType === type.id
                ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
                : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950'
            )}
          >
            <span className="text-3xl">{type.icon}</span>
            <span className={cn(
              'mt-2 text-sm font-bold',
              selectedType === type.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
            )}>
              {type.label}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Input
          label="Data"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Minutos"
            type="number"
            placeholder="0"
            error={errors.durationMinutes?.message}
            {...register('durationMinutes')}
          />
          <Input
            label="Segundos"
            type="number"
            placeholder="0"
            error={errors.durationSeconds?.message}
            {...register('durationSeconds')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Distância (km)"
            type="number"
            step="0.1"
            placeholder="0.0"
            disabled={selectedType === 'Escada'}
            error={errors.distanceKm?.message}
            {...register('distanceKm')}
          />
          <Input
            label="Calorias (kcal)"
            type="number"
            placeholder="0"
            error={errors.calories?.message}
            {...register('calories')}
          />
        </div>
      </div>

      {/* Optional Fields Accordion */}
      <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          className="flex w-full items-center justify-between py-2 text-sm font-medium text-gray-500"
        >
          <span>Campos Opcionais</span>
          {showOptional ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showOptional && (
          <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Frequência Cardíaca (bpm)"
                type="number"
                placeholder="0"
                {...register('heartRate')}
              />
              <Input
                label="Velocidade Média (km/h)"
                type="number"
                step="0.1"
                placeholder="0.0"
                error={errors.avgSpeed?.message}
                {...register('avgSpeed')}
              />
            </div>
            
            {(selectedType === 'Esteira' || selectedType === 'Escada') && (
              <Input
                label={selectedType === 'Esteira' ? 'Inclinação (%)' : 'Nível'}
                type="number"
                placeholder="0"
                {...register('incline')}
              />
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                <span>Esforço Percebido (RPE)</span>
                <span className="text-blue-600 font-bold">{watch('rpe')}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                {...register('rpe')}
              />
              <div className="flex justify-between text-[10px] text-gray-400 px-1">
                <span>Muito Leve</span>
                <span>Máximo</span>
              </div>
            </div>

            <Textarea
              label="Observações"
              placeholder="Como foi o treino?"
              {...register('notes')}
              error={errors.notes?.message}
              maxLength={500}
            />
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => navigate(-1)}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1"
          isLoading={isSubmitting}
        >
          {isEdit ? 'Atualizar Cardio' : 'Salvar Cardio'}
        </Button>
      </div>
    </form>
  );
}
