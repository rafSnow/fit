import { useMemo, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format, subMonths, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { calculateIMC, calculateWHR, cn } from '@/lib/utils';
import type { BodyMetrics } from '@/types/database';

interface MetricsChartProps {
  data: BodyMetrics[];
  userGender: 'M' | 'F';
}

type Period = '1m' | '3m' | '6m' | '1y' | 'all';

const PERIODS: { label: string; value: Period }[] = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1A', value: '1y' },
  { label: 'Tudo', value: 'all' },
];

const METRICS = [
  { label: 'Peso (kg)', value: 'weightKg' },
  { label: 'Gordura (%)', value: 'bodyFatPct' },
  { label: 'IMC', value: 'imc' },
  { label: 'Cintura (cm)', value: 'waist' },
  { label: 'Braço (cm)', value: 'armFlexed' },
  { label: 'Coxa (cm)', value: 'thigh' },
];

export function MetricsChart({ data, userGender }: MetricsChartProps) {
  const [period, setPeriod] = useState<Period>('3m');
  const [selectedMetric, setSelectedMetric] = useState<string>('weightKg');

  const chartData = useMemo(() => {
    if (!data.length) return [];

    const now = startOfDay(new Date());
    let startDate: Date | null = null;

    if (period === '1m') startDate = subMonths(now, 1);
    else if (period === '3m') startDate = subMonths(now, 3);
    else if (period === '6m') startDate = subMonths(now, 6);
    else if (period === '1y') startDate = subMonths(now, 12);

    const filtered = startDate 
      ? data.filter(m => isAfter(new Date(m.date), startDate!))
      : data;

    // We need to sort by date ascending for the chart
    return [...filtered]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(m => {
        let value: number | null;
        if (selectedMetric === 'imc') {
          value = calculateIMC(m.weightKg, m.heightCm).bmi;
        } else if (selectedMetric === 'whr') {
          value = calculateWHR(userGender, m.waist || 0, m.hip || 0)?.ratio || 0;
        } else {
          value = (m as BodyMetrics)[selectedMetric as keyof BodyMetrics] as number | null;
        }

        return {
          date: format(new Date(m.date), 'dd/MM'),
          fullDate: format(new Date(m.date), "dd 'de' MMM", { locale: ptBR }),
          value: value && value > 0 ? value : null,
        };
      });
  }, [data, period, selectedMetric, userGender]);

  if (data.length < 2) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 bg-gray-50/50 dark:bg-gray-900/20 border-dashed">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Dados insuficientes</p>
          <p className="text-xs text-gray-600">Registre pelo menos duas medições para visualizar o gráfico de evolução.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-widest text-gray-400">Evolução</span>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "px-3 py-1 text-[10px] font-black rounded-md transition-all",
                  period === p.value 
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-gray-600 hover:text-gray-700"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {METRICS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMetric(m.value)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all",
                selectedMetric === m.value
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-4 h-[280px] w-full bg-white dark:bg-gray-900">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="currentColor" 
              className="text-gray-200 dark:text-gray-800" 
              opacity={0.5} 
            />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 600, fill: 'currentColor' }}
              className="text-gray-400 dark:text-gray-600"
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 600, fill: 'currentColor' }}
              className="text-gray-400 dark:text-gray-600"
              domain={['auto', 'auto']}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-900 dark:bg-gray-800 text-white p-2 rounded-lg shadow-xl border border-gray-700">
                      <p className="text-[10px] font-bold opacity-70 mb-1">{payload[0].payload.fullDate}</p>
                      <p className="text-sm font-black text-blue-400">
                        {payload[0].value} 
                        <span className="text-[10px] ml-0.5 opacity-70">
                          {METRICS.find(m => m.value === selectedMetric)?.label.split(' ')[1] || ''}
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
