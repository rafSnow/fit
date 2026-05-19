import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateIMC, calculateWHR, cn } from '@/lib/utils';
import type { BodyMetrics } from '@/types/database';

interface MetricsComparisonProps {
  data: BodyMetrics[];
  userGender: 'M' | 'F';
}

interface CompareField {
  label: string;
  key?: keyof BodyMetrics;
  isCalc?: 'imc' | 'whr';
  unit: string;
  better: 'lower' | 'higher' | 'any';
}

export function MetricsComparison({ data, userGender }: MetricsComparisonProps) {
  // Sort dates for the selectors (most recent first)
  const sortedMetrics = useMemo(() => {
    return [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data]);

  const [dateAId, setDateAId] = useState<number | string>('');
  const [dateBId, setDateBId] = useState<number | string>('');

  const effectiveDateAId = dateAId || (sortedMetrics.length >= 2 ? sortedMetrics[0].id! : '');
  const effectiveDateBId = dateBId || (sortedMetrics.length >= 2 ? sortedMetrics[1].id! : '');

  const metricA = useMemo(() => sortedMetrics.find(m => m.id === Number(effectiveDateAId)), [sortedMetrics, effectiveDateAId]);
  const metricB = useMemo(() => sortedMetrics.find(m => m.id === Number(effectiveDateBId)), [sortedMetrics, effectiveDateBId]);

  const compareFields: CompareField[] = [
    { label: 'Peso', key: 'weightKg', unit: 'kg', better: 'lower' },
    { label: 'IMC', isCalc: 'imc', unit: '', better: 'lower' },
    { label: 'Gordura', key: 'bodyFatPct', unit: '%', better: 'lower' },
    { label: 'RCQ', isCalc: 'whr', unit: '', better: 'lower' },
    { label: 'Cintura', key: 'waist', unit: 'cm', better: 'lower' },
    { label: 'Pescoço', key: 'neck', unit: 'cm', better: 'any' },
    { label: 'Braço Relax.', key: 'armRelaxed', unit: 'cm', better: 'higher' },
    { label: 'Braço Contr.', key: 'armFlexed', unit: 'cm', better: 'higher' },
    { label: 'Peito', key: 'chest', unit: 'cm', better: 'higher' },
    { label: 'Coxa', key: 'thigh', unit: 'cm', better: 'higher' },
    { label: 'Panturrilha', key: 'calf', unit: 'cm', better: 'higher' },
  ];

  const getVal = (m: BodyMetrics | undefined, field: CompareField) => {
    if (!m) return null;
    if (field.isCalc === 'imc') return calculateIMC(m.weightKg, m.heightCm).bmi;
    if (field.isCalc === 'whr') return calculateWHR(userGender, m.waist || 0, m.hip || 0)?.ratio || 0;
    if (field.key) return (m[field.key] as number) || 0;
    return 0;
  };

  if (data.length < 2) return null;

  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm font-black uppercase tracking-widest text-gray-400">Comparação Detalhada</span>
      
      <Card className="p-4 flex flex-col gap-4 shadow-lg border-blue-50 dark:border-blue-900/20">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Data A (Nova)</label>
            <select 
              value={effectiveDateAId} 
              onChange={(e) => setDateAId(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg p-2.5 text-xs font-black text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
            >
              {sortedMetrics.map(m => (
                <option key={m.id} value={m.id}>
                  {format(new Date(m.date), 'dd/MM/yyyy')}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Data B (Antiga)</label>
            <select 
              value={effectiveDateBId} 
              onChange={(e) => setDateBId(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg p-2.5 text-xs font-black text-gray-500 focus:ring-2 focus:ring-blue-500"
            >
              {sortedMetrics.map(m => (
                <option key={m.id} value={m.id}>
                  {format(new Date(m.date), 'dd/MM/yyyy')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col overflow-x-auto">
          <div className="grid grid-cols-5 py-2 text-[9px] font-black text-gray-400 uppercase tracking-tighter border-b border-gray-100 dark:border-gray-800">
            <span className="col-span-2">Métrica</span>
            <span className="text-right">A</span>
            <span className="text-right">B</span>
            <span className="text-right">Delta / %</span>
          </div>
          
          {compareFields.map((f, idx) => {
            const valA = getVal(metricA, f);
            const valB = getVal(metricB, f);
            
            if (valA === null || valB === null || (valA === 0 && valB === 0)) return null;
            
            const diff = valA - valB;
            const pctChange = valB !== 0 ? (diff / valB) * 100 : 0;
            const isBetter = f.better === 'lower' ? diff < 0 : f.better === 'higher' ? diff > 0 : null;
            
            return (
              <div key={idx} className="grid grid-cols-5 py-3 border-b border-gray-50 dark:border-gray-800/30 items-center last:border-none">
                <span className="col-span-2 text-[11px] font-bold text-gray-700 dark:text-gray-300">{f.label}</span>
                <span className="text-[11px] font-black text-right">{valA}<span className="text-[9px] font-normal opacity-50 ml-0.5">{f.unit}</span></span>
                <span className="text-[11px] font-bold text-right text-gray-400">{valB}<span className="text-[9px] font-normal opacity-50 ml-0.5">{f.unit}</span></span>
                <div className={cn(
                  "flex flex-col items-end leading-none",
                  diff === 0 ? "text-gray-400" : isBetter === true ? "text-emerald-500" : isBetter === false ? "text-red-500" : "text-blue-500"
                )}>
                  <div className="flex items-center gap-0.5 text-[11px] font-black">
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                    {diff > 0 ? <TrendingUp size={10} /> : diff < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                  </div>
                  {diff !== 0 && (
                    <span className="text-[9px] font-bold opacity-80">
                      {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
