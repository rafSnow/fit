import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useExercises } from '@/hooks/useExercises';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useToastStore } from '@/stores/useToastStore';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { ArrowLeft, Save } from 'lucide-react';
import { hapticFeedback } from '@/lib/utils';

const MUSCLE_GROUPS = [
  { label: 'Selecione um grupo', value: '' },
  { label: 'Peito', value: 'Peito' },
  { label: 'Costas', value: 'Costas' },
  { label: 'Ombro', value: 'Ombro' },
  { label: 'Bíceps', value: 'Bíceps' },
  { label: 'Tríceps', value: 'Tríceps' },
  { label: 'Pernas', value: 'Pernas' },
  { label: 'Glúteos', value: 'Glúteos' },
  { label: 'Abdômen', value: 'Abdômen' },
];

const EQUIPMENTS = [
  { label: 'Selecione um equipamento', value: '' },
  { label: 'Barra', value: 'Barra' },
  { label: 'Haltere', value: 'Haltere' },
  { label: 'Polia', value: 'Polia' },
  { label: 'Máquina', value: 'Máquina' },
  { label: 'Peso Corporal', value: 'Peso Corporal' },
  { label: 'Elástico', value: 'Elástico' },
  { label: 'Kettlebell', value: 'Kettlebell' },
  { label: 'Outro', value: 'Outro' },
];

export default function ExerciseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { create, update, getById } = useExercises();
  const { addToast } = useToastStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '',
    secondaryMuscle: '',
    equipment: '',
    sub1Id: undefined as number | undefined,
    sub2Id: undefined as number | undefined,
    youtubeUrl: '',
    notes: '',
  });

  const isEdit = !!id;
  useHeader(isEdit ? 'Editar Exercício' : 'Novo Exercício', (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft size={20} />
    </Button>
  ));

  useEffect(() => {
    if (isEdit) {
      getById(Number(id)).then(async (ex) => {
        if (ex) {
          setFormData({
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            secondaryMuscle: ex.secondaryMuscle || '',
            equipment: ex.equipment,
            sub1Id: ex.sub1Id,
            sub2Id: ex.sub2Id,
            youtubeUrl: ex.youtubeUrl || '',
            notes: ex.notes || '',
          });
        }
      });
    }
  }, [id, isEdit, getById]);

  const validateYoutubeUrl = (url: string) => {
    if (!url) return true;
    const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return regExp.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'O nome do exercício é obrigatório.';
    if (!formData.muscleGroup) newErrors.muscleGroup = 'Selecione o grupo muscular.';
    if (!formData.equipment) newErrors.equipment = 'Selecione o equipamento.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      hapticFeedback.error();
      addToast('Verifique os campos obrigatórios.', 'error');
      return;
    }

    if (formData.youtubeUrl && !validateYoutubeUrl(formData.youtubeUrl)) {
      setErrors({ ...newErrors, youtubeUrl: 'URL do YouTube inválida.' });
      hapticFeedback.error();
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await update(Number(id), formData);
        addToast('Exercício atualizado!');
      } else {
        await create(formData);
        addToast('Exercício criado!');
      }
      hapticFeedback.success();
      navigate('/exercises');
    } catch (error) {
      hapticFeedback.error();
      addToast(error instanceof Error ? error.message : 'Erro ao salvar', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Nome do Exercício *"
          placeholder="Ex: Supino Inclinado"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          error={errors.name}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Músculo Primário *"
            value={formData.muscleGroup}
            onChange={(e) => {
              setFormData({ ...formData, muscleGroup: e.target.value });
              if (errors.muscleGroup) setErrors({ ...errors, muscleGroup: '' });
            }}
            options={MUSCLE_GROUPS}
            error={errors.muscleGroup}
            required
          />
          <Select
            label="Músculo Secundário"
            value={formData.secondaryMuscle}
            onChange={(e) => setFormData({ ...formData, secondaryMuscle: e.target.value })}
            options={MUSCLE_GROUPS}
          />
        </div>

        <Select
          label="Equipamento *"
          value={formData.equipment}
          onChange={(e) => {
            setFormData({ ...formData, equipment: e.target.value });
            if (errors.equipment) setErrors({ ...errors, equipment: '' });
          }}
          options={EQUIPMENTS}
          error={errors.equipment}
          required
        />

        <ExercisePicker
          label="Substituição 1"
          value={formData.sub1Id}
          onSelect={(ex) => setFormData({ ...formData, sub1Id: ex?.id })}
          excludeId={Number(id)}
        />

        <ExercisePicker
          label="Substituição 2"
          value={formData.sub2Id}
          onSelect={(ex) => setFormData({ ...formData, sub2Id: ex?.id })}
          excludeId={Number(id)}
        />

        <Input
          label="URL do YouTube"
          placeholder="https://www.youtube.com/watch?v=..."
          value={formData.youtubeUrl}
          onChange={(e) => {
            setFormData({ ...formData, youtubeUrl: e.target.value });
            if (errors.youtubeUrl) setErrors({ ...errors, youtubeUrl: '' });
          }}
          error={errors.youtubeUrl}
        />

        <Textarea
          label="Notas de Execução"
          placeholder="Dicas, cuidados, etc."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          maxLength={500}
        />

        <div className="flex flex-col gap-3 pt-4">
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            {!isSubmitting && <Save size={18} className="mr-2" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Exercício'}
          </Button>
          <Button
            type="button"
            variant="outline"
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
