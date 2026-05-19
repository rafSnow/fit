import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useBodyMetrics } from '@/hooks/useBodyMetrics';
import { useToastStore } from '@/stores/useToastStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { db } from '@/lib/db';
import { 
  ArrowLeft, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  Scale, 
  Ruler, 
  Activity,
  Percent,
  CircleDashed,
  Target,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { calculateIMC, calculateBodyFat, calculateWHR, calculateIdealWeight, hapticFeedback } from '@/lib/utils';
import type { BodyMetrics } from '@/types/database';

export default function MetricsFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { createMetrics, updateMetrics, getMetricsById, getLatestMetrics } = useBodyMetrics();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCircumferences, setShowCircumferences] = useState(true);
  const [userGender, setUserGender] = useState<'M' | 'F' | null>(null);

  const [formData, setFormData] = useState<Partial<BodyMetrics>>({
    date: new Date(),
    weightKg: undefined,
    heightCm: undefined,
  });

  useHeader(id ? 'Editar Medidas' : 'Novas Medidas', (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft size={20} />
    </Button>
  ));

  useEffect(() => {
    const loadInitialData = async () => {
      // Load Gender
      const gender = await db.settings.get('gender');
      if (gender) setUserGender(gender.value as 'M' | 'F' | null);

      if (id) {
        const metrics = await getMetricsById(Number(id));
        if (metrics) setFormData(metrics);
      } else {
        // Pre-fill height from last entry or onboarding setting
        const latest = await getLatestMetrics();
        if (latest) {
          setFormData(prev => ({ ...prev, heightCm: latest.heightCm }));
        } else {
          const defaultHeight = await db.settings.get('defaultHeight');
          if (defaultHeight?.value) {
            setFormData(prev => ({ ...prev, heightCm: parseInt(defaultHeight.value as string) }));
          }
        }
      }
    };
    loadInitialData();
  }, [id, getLatestMetrics, getMetricsById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.weightKg) newErrors.weightKg = 'O peso é obrigatório.';
    if (!formData.heightCm) newErrors.heightCm = 'A altura é obrigatória.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      hapticFeedback.error();
      addToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const dataToSave = {
        ...formData,
        date: formData.date ? new Date(formData.date) : new Date(),
      } as BodyMetrics;

      if (id) {
        await updateMetrics(Number(id), dataToSave);
        addToast('Medidas atualizadas!');
      } else {
        await createMetrics(dataToSave);
        addToast('Medidas registradas com sucesso!');
      }
      hapticFeedback.success();
      navigate('/metrics');
    } catch {
      hapticFeedback.error();
      addToast('Erro ao salvar medidas', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const imc = calculateIMC(formData.weightKg || 0, formData.heightCm || 0);
  const bf = calculateBodyFat(
    userGender || 'M',
    formData.heightCm || 0,
    formData.waist || 0,
    formData.neck || 0,
    formData.hip
  );
  const whr = calculateWHR(userGender || 'M', formData.waist || 0, formData.hip || 0);
  const idealWeight = calculateIdealWeight(userGender || 'M', formData.heightCm || 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 pb-24 animate-in fade-in duration-500">
      {!userGender && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30">
          <Link to="/settings" className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertCircle size={20} className="shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-black uppercase">Sexo não configurado</p>
              <p className="text-xs font-bold opacity-80">Configure nos Ajustes para cálculos precisos de gordura e peso ideal.</p>
            </div>
            <ChevronRight size={16} />
          </Link>
        </Card>
      )}

      {/* Real-time Preview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Activity size={14} />
            <span className="text-[10px] font-black uppercase">IMC</span>
          </div>
          <span className="text-lg font-black">{imc.bmi > 0 ? imc.bmi : '--'}</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase truncate">{imc.label}</span>
        </Card>
        <Card className="p-3 bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <Percent size={14} />
            <span className="text-[10px] font-black uppercase tracking-tight">% Gordura</span>
          </div>
          <span className="text-lg font-black">{bf ? `${bf.bf}%` : '--'}</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase truncate">
            {bf?.label || 'Faltam dados'}
          </span>
        </Card>
        <Card className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CircleDashed size={14} />
            <span className="text-[10px] font-black uppercase">RCQ</span>
          </div>
          <span className="text-lg font-black">{whr ? whr.ratio : '--'}</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase truncate">
            Risco: {whr?.risk || 'Faltam dados'}
          </span>
        </Card>
        <Card className="p-3 bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
            <Target size={14} />
            <span className="text-[10px] font-black uppercase tracking-tight">Peso Ideal</span>
          </div>
          <span className="text-lg font-black">{idealWeight > 0 ? `${idealWeight}kg` : '--'}</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase truncate">
            Est. Devine
          </span>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-black flex items-center gap-2">
          <Scale size={20} className="text-blue-500" />
          Medidas Básicas
        </h2>
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Peso (kg)"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={formData.weightKg ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                setFormData({ ...formData, weightKg: val });
                if (errors.weightKg) setErrors({ ...errors, weightKg: '' });
              }}
              error={errors.weightKg}
              placeholder="0.0"
              required
            />
            <Input
              label="Altura (cm)"
              type="number"
              inputMode="numeric"
              value={formData.heightCm ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                setFormData({ ...formData, heightCm: val });
                if (errors.heightCm) setErrors({ ...errors, heightCm: '' });
              }}
              error={errors.heightCm}
              placeholder="0"
              required
            />
          </div>
          <Input
            label="Data"
            type="date"
            value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
            required
          />
        </Card>
      </section>

      <section className="space-y-4">
        <button 
          type="button"
          onClick={() => setShowCircumferences(!showCircumferences)}
          className="w-full flex items-center justify-between text-lg font-black"
        >
          <div className="flex items-center gap-2">
            <Ruler size={20} className="text-purple-500" />
            Circunferências (cm)
          </div>
          {showCircumferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showCircumferences && (
          <Card className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pescoço"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.neck ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, neck: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Cintura"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.waist ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, waist: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Quadril"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.hip ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, hip: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Ombros"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.shoulders ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, shoulders: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Peito/Tórax"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.chest ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, chest: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Braço Relax."
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.armRelaxed ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, armRelaxed: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Braço Contr."
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.armFlexed ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, armFlexed: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Antebraço"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.forearm ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, forearm: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Coxa"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.thigh ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, thigh: val });
                }}
                placeholder="0.0"
              />
              <Input
                label="Panturrilha"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.calf ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setFormData({ ...formData, calf: val });
                }}
                placeholder="0.0"
              />
            </div>
            <Textarea
              label="Notas"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ex: Medido em jejum..."
              className="mt-2"
              maxLength={500}
            />
          </Card>
        )}
      </section>

      <Button
        type="submit"
        className="h-16 text-lg font-black gap-2 shadow-xl shadow-blue-200 dark:shadow-none mt-4"
        isLoading={isLoading}
      >
        <Save size={24} />
        Salvar Medidas
      </Button>

    </form>
  );
}
