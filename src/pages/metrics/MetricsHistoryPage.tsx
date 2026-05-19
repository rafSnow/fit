import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '@/hooks/useHeader';
import { useBodyMetrics } from '@/hooks/useBodyMetrics';
import { useToastStore } from '@/stores/useToastStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Calendar, 
  Trash2, 
  Edit2,
  Download,
  Scale,
  Ruler
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateIMC, calculateBodyFat } from '@/lib/utils';
import { db } from '@/lib/db';
import { EmptyState } from '@/components/ui/EmptyState';

const MetricsIllustration = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    <div className="absolute inset-0 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-2xl animate-pulse"></div>
    <div className="relative z-10 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-purple-50 dark:border-purple-900/30">
      <Scale className="h-12 w-12 text-purple-500" />
    </div>
    <div className="absolute bottom-2 right-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-lg">
      <Ruler size={24} className="text-blue-500" />
    </div>
  </div>
);

const MetricsHistorySkeleton = () => (
  <div className="flex flex-col gap-4 p-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="p-4 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-2 w-20" />
            </div>
          ))}
        </div>
      </Card>
    ))}
  </div>
);

export default function MetricsHistoryPage() {
  const navigate = useNavigate();
  const { allMetrics, deleteMetrics, isLoading } = useBodyMetrics();
  const { addToast } = useToastStore();
  const [userGender, setUserGender] = useState<'M' | 'F'>('M');

  const handleExportCSV = () => {
    if (allMetrics.length === 0) return;

    const headers = [
      'Data', 'Peso (kg)', 'Altura (cm)', 'IMC', 'Gordura (%)',
      'Pescoco', 'Ombros', 'Peito', 'Cintura', 'Quadril',
      'Braco Relaxado', 'Braco Contraido', 'Antebraco', 'Coxa', 'Panturrilha', 'Notas'
    ];

    const rows = allMetrics.map(m => {
      const imc = calculateIMC(m.weightKg, m.heightCm);
      const bf = calculateBodyFat(userGender, m.heightCm, m.waist || 0, m.neck || 0, m.hip);
      
      return [
        format(new Date(m.date), 'yyyy-MM-dd'),
        m.weightKg,
        m.heightCm,
        imc.bmi,
        bf ? bf.bf : '',
        m.neck || '',
        m.shoulders || '',
        m.chest || '',
        m.waist || '',
        m.hip || '',
        m.armRelaxed || '',
        m.armFlexed || '',
        m.forearm || '',
        m.thigh || '',
        m.calf || '',
        `"${(m.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitness-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('CSV exportado com sucesso!', 'success');
  };

  useHeader('Histórico de Medidas', (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleExportCSV}
      disabled={allMetrics.length === 0}
      title="Exportar CSV"
    >
      <Download size={20} />
    </Button>
  ));

  useEffect(() => {
    const loadSettings = async () => {
      const gender = await db.settings.get('gender');
      if (gender) setUserGender(gender.value as 'M' | 'F');
    };
    loadSettings();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir esta medição permanentemente?')) {
      await deleteMetrics(id);
      addToast('Medição excluída.');
    }
  };

  if (isLoading) {
    return <MetricsHistorySkeleton />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 animate-in fade-in duration-500">
      {allMetrics.length > 0 ? (
        allMetrics.map((metrics) => {
          const imc = calculateIMC(metrics.weightKg, metrics.heightCm);
          const bf = calculateBodyFat(
            userGender, 
            metrics.heightCm, 
            metrics.waist || 0, 
            metrics.neck || 0, 
            metrics.hip
          );

          return (
            <Card key={metrics.id} className="p-4 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Calendar size={16} />
                  <span className="text-sm font-black uppercase tracking-tight">
                    {format(new Date(metrics.date), "d 'de' MMMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(`/metrics/${metrics.id}/edit`)}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                    onClick={() => metrics.id && handleDelete(metrics.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400">Peso</span>
                  <span className="text-lg font-black">{metrics.weightKg}<span className="text-xs ml-0.5">kg</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400">IMC</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-black">{imc.bmi}</span>
                    <span className="text-[9px] font-bold text-blue-500 truncate leading-tight">{imc.label}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400">% Gordura</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-black">{bf ? `${bf.bf}%` : '--'}</span>
                    {bf && <span className="text-[9px] font-bold text-orange-500 truncate leading-tight">{bf.label}</span>}
                  </div>
                </div>
              </div>

              {(metrics.waist || metrics.chest || metrics.armRelaxed) && (
                <div className="pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {metrics.waist && (
                      <span className="text-[10px] text-gray-500 font-medium">Cintura: <b>{metrics.waist}cm</b></span>
                    )}
                    {metrics.chest && (
                      <span className="text-[10px] text-gray-500 font-medium">Peito: <b>{metrics.chest}cm</b></span>
                    )}
                    {metrics.armRelaxed && (
                      <span className="text-[10px] text-gray-500 font-medium">Braço: <b>{metrics.armRelaxed}cm</b></span>
                    )}
                  </div>
                </div>
              )}

              {metrics.notes && (
                <div className="text-[10px] text-gray-400 italic bg-gray-50 dark:bg-gray-900/40 p-2 rounded border-l-2 border-gray-200 dark:border-gray-700">
                  "{metrics.notes}"
                </div>
              )}
            </Card>
          );
        })
      ) : (
        <EmptyState
          illustration={<MetricsIllustration />}
          title="Histórico Vazio"
          description="Você ainda não tem medições registradas. Comece agora para ver seu progresso ao longo do tempo."
          actionLabel="Registrar Medida"
          onAction={() => navigate('/metrics/new')}
        />
      )}
    </div>
  );
}
