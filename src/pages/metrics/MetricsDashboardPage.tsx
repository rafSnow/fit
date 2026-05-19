import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useBodyMetrics } from '@/hooks/useBodyMetrics';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { 
  Scale, 
  Activity, 
  Percent, 
  History, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Ruler
} from 'lucide-react';
import { 
  calculateIMC, 
  calculateBodyFat, 
  formatRelativeUpdate, 
  cn 
} from '@/lib/utils';
import { db } from '@/lib/db';
import { MetricsChart } from '@/components/metrics/MetricsChart';
import { MetricsComparison } from '@/components/metrics/MetricsComparison';
import { Skeleton } from '@/components/ui/Skeleton';

const MetricsSkeleton = () => (
  <div className="p-4 space-y-6">
    <Skeleton className="h-32 w-full rounded-2xl" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
    <Skeleton className="h-64 w-full rounded-2xl" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  </div>
);

const MetricsIllustration = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    <div className="absolute inset-0 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-2xl"></div>
    <div className="relative z-10 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-purple-50 dark:border-purple-900/30">
      <Scale className="h-12 w-12 text-purple-500" />
    </div>
    <div className="absolute bottom-2 right-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-lg">
      <Ruler size={24} className="text-blue-500" />
    </div>
  </div>
);

export default function MetricsDashboardPage() {
  const navigate = useNavigate();
  const { allMetrics, isLoading } = useBodyMetrics();
  const [userGender, setUserGender] = useState<'M' | 'F'>('M');
  const [userHeight, setUserHeight] = useState<number>(0);

  useHeader('Métricas Corporais');

  const latest = allMetrics.length > 0 ? allMetrics[0] : null;
  const previous = allMetrics.length > 1 ? allMetrics[1] : null;

  useEffect(() => {
    const loadSettings = async () => {
      const gender = await db.settings.get('gender');
      if (gender) setUserGender(gender.value as 'M' | 'F');

      const height = await db.settings.get('defaultHeight');
      if (height) setUserHeight(parseInt(height.value as string));
    };
    loadSettings();
  }, []);

  if (isLoading) {
    return <MetricsSkeleton />;
  }

  if (allMetrics.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <EmptyState
          illustration={<MetricsIllustration />}
          title="Nenhuma medição"
          description="Registre suas primeiras medidas para acompanhar sua evolução corporal."
          actionLabel="Registrar Medidas"
          onAction={() => navigate('/metrics/new')}
        />
        <FAB onClick={() => navigate('/metrics/new')}>
          <Plus />
        </FAB>
      </div>
    );
  }

  const weightDelta = previous ? latest!.weightKg - previous.weightKg : 0;
  const heightForCalc = latest?.heightCm || userHeight;
  const imc = latest ? calculateIMC(latest.weightKg, heightForCalc) : null;
  const bf = latest ? calculateBodyFat(
    userGender, 
    heightForCalc, 
    latest.waist || 0, 
    latest.neck || 0, 
    latest.hip
  ) : null;

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Weight Card */}
        <Card className="p-6 border-blue-100 dark:border-blue-900/30 shadow-lg shadow-blue-50 dark:shadow-none">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Scale size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Peso Atual</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900 dark:text-gray-100">
                  {latest?.weightKg} <span className="text-xl font-bold text-gray-400">kg</span>
                </span>
                {weightDelta !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full",
                    weightDelta < 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-600 bg-red-50 dark:bg-red-900/20"
                  )}>
                    {weightDelta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {Math.abs(weightDelta).toFixed(1)} kg
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {latest && formatRelativeUpdate(latest.date)}
              </span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {/* IMC Card */}
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Activity size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">IMC</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{imc?.bmi}</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">{imc?.label}</span>
            </div>
          </Card>

          {/* Body Fat Card */}
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Percent size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">% Gordura</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
                {bf ? `${bf.bf}%` : '--'}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                {bf?.label || 'Faltam dados'}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Evolution Chart */}
      <MetricsChart data={allMetrics} userGender={userGender} />

      {/* Comparison Section */}
      <MetricsComparison data={allMetrics} userGender={userGender} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="secondary" 
          className="gap-2 h-14 font-bold"
          onClick={() => navigate('/metrics/history')}
        >
          <History size={20} />
          Histórico
        </Button>
        <Button 
          variant="secondary" 
          className="gap-2 h-14 font-bold"
          onClick={() => navigate('/metrics/photos')}
        >
          <Plus size={20} />
          Fotos
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-900/50 border-dashed border-gray-200 dark:border-gray-800">
        <div className="flex gap-3">
          <Info size={20} className="text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            O percentual de gordura é estimado usando o <b>Método da Marinha (US Navy)</b>, 
            que requer medidas de altura, pescoço e cintura (e quadril para mulheres).
          </p>
        </div>
      </Card>

      <FAB onClick={() => navigate('/metrics/new')}>
        <Plus />
      </FAB>
    </div>
  );
}
