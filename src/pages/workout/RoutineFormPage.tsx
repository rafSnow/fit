import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useRoutines } from '@/hooks/useRoutines';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/stores/useToastStore';
import { ArrowLeft, Save } from 'lucide-react';
import { cn, hapticFeedback } from '@/lib/utils';

const DAYS = [
  { label: 'DOM', value: 0 },
  { label: 'SEG', value: 1 },
  { label: 'TER', value: 2 },
  { label: 'QUA', value: 3 },
  { label: 'QUI', value: 4 },
  { label: 'SEX', value: 5 },
  { label: 'SAB', value: 6 },
];

export default function RoutineFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { create, update, getById } = useRoutines();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    days: [] as number[],
    isActive: true,
  });

  const isEdit = !!id;
  
  const headerActions = React.useMemo(() => (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft size={20} />
    </Button>
  ), [navigate]);

  useHeader(isEdit ? 'Editar Rotina' : 'Nova Rotina', headerActions);

  useEffect(() => {
    if (isEdit) {
      getById(Number(id)).then((routine) => {
        if (routine) {
          setFormData({
            name: routine.name,
            days: routine.days,
            isActive: routine.isActive,
          });
        }
      });
    }
  }, [id, isEdit, getById]);

  const toggleDay = (dayValue: number) => {
    setFormData((prev) => {
      const isSelected = prev.days.includes(dayValue);
      if (isSelected) {
        return { ...prev, days: prev.days.filter((d) => d !== dayValue) };
      } else {
        return { ...prev, days: [...prev.days, dayValue].sort() };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: 'O nome da rotina é obrigatório.' });
      hapticFeedback.error();
      return;
    }

    setIsSubmitting(true);
    try {
      let routineId: number;
      if (isEdit) {
        if (formData.isActive) {
          const routineData = await getById(Number(id));
          if (!routineData || routineData.exercises.length === 0) {
            addToast('Adicione pelo menos 1 exercício antes de ativar a rotina.', 'error');
            hapticFeedback.error();
            setIsSubmitting(false);
            return;
          }
        }
        await update(Number(id), formData);
        routineId = Number(id);
        addToast('Rotina atualizada!');
      } else {
        routineId = await create(formData);
        addToast('Rotina criada!');
      }
      hapticFeedback.success();
      // Redirect to exercise configuration (Detail page handles the config list)
      navigate(`/routines/${routineId}`);
    } catch {
      hapticFeedback.error();
      addToast('Erro ao salvar rotina', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <Input
          label="Nome da Rotina *"
          placeholder="Ex: Treino A - Peito e Tríceps"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          error={errors.name}
          required
        />

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Dias da Semana
          </label>
          <div className="flex justify-between gap-1">
            {DAYS.map((day) => {
              const isSelected = formData.days.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "flex-1 h-10 rounded-md text-[10px] font-bold border transition-all",
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                      : "bg-white border-gray-200 text-gray-400 hover:border-blue-300 dark:bg-gray-900 dark:border-gray-800"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 italic">
            Selecione em quais dias você pretende realizar este treino.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Rotina Ativa</span>
            <span className="text-xs text-gray-500">Aparecerá no plano de treino semanal</span>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
              formData.isActive ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                formData.isActive ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button type="submit" isLoading={isSubmitting} className="w-full py-6">
            {!isSubmitting && <Save size={18} className="mr-2" />}
            {isEdit ? 'Salvar Alterações' : 'Configurar Exercícios'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
