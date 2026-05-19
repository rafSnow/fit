import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToastStore } from '@/stores/useToastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/hooks/useTheme';
import { useHeader } from '@/hooks/useHeader';
import { useRoutines } from '@/hooks/useRoutines';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { playBeep, cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { 
  Volume2, 
  Play, 
  User, 
  Moon, 
  Sun, 
  Settings2, 
  Database, 
  Info,
  ChevronRight,
  Calendar,
  Check,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

const APP_VERSION = '1.2.0';

const DAYS = [
  { label: 'DOM', value: 0 },
  { label: 'SEG', value: 1 },
  { label: 'TER', value: 2 },
  { label: 'QUA', value: 3 },
  { label: 'QUI', value: 4 },
  { label: 'SEX', value: 5 },
  { label: 'SAB', value: 6 },
];

interface ProfileSettings {
  name: string;
  gender: 'M' | 'F' | null;
  birthdate: string;
  defaultHeight: string;
}

interface ProgressionSettings {
  compoundIncrement: number;
  isolationIncrement: number;
}

export default function SettingsPage() {
  useHeader('Configurações');
  const { theme, toggleTheme } = useTheme();
  const { routines } = useRoutines();
  const { addToast } = useToastStore();
  const { restTimerSound, restTimerVibration, setRestTimerSettings } = useWorkoutStore();

  const [profile, setProfile] = useState<ProfileSettings>({
    name: '',
    gender: 'M',
    birthdate: '',
    defaultHeight: ''
  });

  const [units, setUnits] = useState({
    weight: 'kg',
    measure: 'cm'
  });

  const [progression, setProgression] = useState<ProgressionSettings>({
    compoundIncrement: 2.5,
    isolationIncrement: 1.25
  });

  const [workoutSchedule, setWorkoutSchedule] = useState<Record<number, number>>({});
  const [editingDay, setEditingDay] = useState<number | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const allSettings = await db.settings.toArray();
      const settingsMap = allSettings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, unknown>);

      setProfile({
        name: (settingsMap.name as string) || '',
        gender: (settingsMap.gender as ProfileSettings['gender']) || 'M',
        birthdate: (settingsMap.birthdate as string) || '',
        defaultHeight: (settingsMap.defaultHeight as string) || ''
      });

      setUnits({
        weight: (settingsMap.weightUnit as string) || 'kg',
        measure: (settingsMap.measureUnit as string) || 'cm'
      });

      setProgression({
        compoundIncrement: (settingsMap.compoundIncrement as number) || 2.5,
        isolationIncrement: (settingsMap.isolationIncrement as number) || 1.25
      });

      setWorkoutSchedule((settingsMap.workoutSchedule as Record<number, number>) || {});
    };

    loadSettings();
  }, []);

  const updateSetting = async (key: string, value: unknown) => {
    await db.settings.put({ key, value });
  };

  const handleProfileChange = async (field: keyof ProfileSettings, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    await updateSetting(field, value);
  };

  const handleUnitChange = async (type: 'weight' | 'measure', value: string) => {
    setUnits(prev => ({ ...prev, [type]: value }));
    await updateSetting(`${type}Unit`, value);
    addToast('Unidades atualizadas.', 'success');
  };

  const handleScheduleChange = async (day: number, routineId: string) => {
    const newSchedule = { ...workoutSchedule, [day]: parseInt(routineId) || 0 };
    if (parseInt(routineId) === 0) {
      delete newSchedule[day];
    }
    setWorkoutSchedule(newSchedule);
    await updateSetting('workoutSchedule', newSchedule);
  };

  const handleProgressionChange = async (field: keyof typeof progression, value: string) => {
    const numValue = parseFloat(value) || 0;
    setProgression(prev => ({ ...prev, [field]: numValue }));
    await updateSetting(field, numValue);
  };

  const resetProgressionSuggestions = async () => {
    if (window.confirm('Deseja resetar todas as sugestões de progressão ativas?')) {
      await db.routineExercises.toCollection().modify({ progressionSuggested: false });
      addToast('Sugestões de progressão resetadas.', 'success');
    }
  };

  const testAlert = () => {
    if (restTimerSound) playBeep();
    if (restTimerVibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    addToast('Teste de alerta enviado!', 'info');
  };

  return (
    <div className="flex flex-col gap-8 p-4 pb-24 animate-in fade-in duration-500">
      {/* Perfil */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
          <User size={16} />
          Perfil
        </h2>
        <div className="flex flex-col gap-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <Input 
            label="Nome"
            placeholder="Seu nome"
            value={profile.name}
            onChange={(e) => handleProfileChange('name', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Sexo"
              value={profile.gender || 'M'}
              onChange={(e) => handleProfileChange('gender', e.target.value)}
              options={[
                { label: 'Masculino', value: 'M' },
                { label: 'Feminino', value: 'F' }
              ]}
            />
            <Input 
              label="Data Nasc."
              type="date"
              value={profile.birthdate}
              onChange={(e) => handleProfileChange('birthdate', e.target.value)}
            />
          </div>
          <Input 
            label="Altura Padrão (cm)"
            type="number"
            placeholder="170"
            value={profile.defaultHeight}
            onChange={(e) => handleProfileChange('defaultHeight', e.target.value)}
          />
        </div>
      </section>

      {/* Aparência */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
          {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          Aparência
        </h2>
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col">
            <span className="font-bold">Modo Escuro</span>
            <span className="text-xs text-gray-400">Alternar tema do aplicativo</span>
          </div>
          <Button 
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            size="sm"
            onClick={toggleTheme}
            className="w-24"
          >
            {theme === 'dark' ? 'Ativado' : 'Desativado'}
          </Button>
        </div>
      </section>

      {/* Unidades */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
          <Settings2 size={16} />
          Unidades
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-400 uppercase">Peso</span>
            <div className="flex gap-2">
              <Button 
                variant={units.weight === 'kg' ? 'primary' : 'ghost'} 
                className="flex-1 h-9 text-xs"
                onClick={() => handleUnitChange('weight', 'kg')}
              >
                kg
              </Button>
              <Button 
                variant={units.weight === 'lb' ? 'primary' : 'ghost'} 
                className="flex-1 h-9 text-xs"
                onClick={() => handleUnitChange('weight', 'lb')}
              >
                lb
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <span className="text-xs font-bold text-gray-400 uppercase">Medidas</span>
            <div className="flex gap-2">
              <Button 
                variant={units.measure === 'cm' ? 'primary' : 'ghost'} 
                className="flex-1 h-9 text-xs"
                onClick={() => handleUnitChange('measure', 'cm')}
              >
                cm
              </Button>
              <Button 
                variant={units.measure === 'in' ? 'primary' : 'ghost'} 
                className="flex-1 h-9 text-xs"
                onClick={() => handleUnitChange('measure', 'in')}
              >
                in
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Treino - Vínculo Semanal */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
          <Calendar size={16} />
          Planejamento Semanal
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-widest text-center">Programação de Treino</p>
          
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => {
              const routineId = workoutSchedule[day.value];
              const routine = routines.find(r => r.id === routineId);
              
              return (
                <button 
                  key={day.value} 
                  className={cn(
                    "flex flex-col items-center gap-2 p-1 rounded-2xl transition-all active:scale-95",
                    routine ? "bg-blue-500/10 dark:bg-blue-500/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setEditingDay(day.value)}
                >
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl font-black text-[10px] uppercase border",
                    routine 
                      ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200 dark:shadow-none" 
                      : "bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700"
                  )}>
                    {day.label}
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-tight text-center line-clamp-1 w-full px-1",
                    routine ? "text-blue-600 dark:text-blue-400" : "text-gray-300"
                  )}>
                    {routine ? routine.name : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Routine Selector Sheet */}
      <BottomSheet 
        isOpen={editingDay !== null} 
        onClose={() => setEditingDay(null)}
        title={editingDay !== null ? `Rotina para ${DAYS.find(d => d.value === editingDay)?.label}` : ''}
      >
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pb-6">
          <Button
            variant={editingDay !== null && !workoutSchedule[editingDay] ? 'primary' : 'outline'}
            className="justify-start gap-4 h-14 rounded-2xl px-6"
            onClick={() => {
              if (editingDay !== null) handleScheduleChange(editingDay, '0');
              setEditingDay(null);
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <Sun size={18} />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold">Descanso</span>
              <span className="text-[10px] uppercase font-black opacity-50">Dia de recuperação</span>
            </div>
            {editingDay !== null && !workoutSchedule[editingDay] && <Check className="ml-auto" size={20} />}
          </Button>

          {routines.map((routine) => (
            <Button
              key={routine.id}
              variant={editingDay !== null && workoutSchedule[editingDay] === routine.id ? 'primary' : 'outline'}
              className="justify-start gap-4 h-14 rounded-2xl px-6"
              onClick={() => {
                if (editingDay !== null) handleScheduleChange(editingDay, routine.id!.toString());
                setEditingDay(null);
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Calendar size={18} />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold">{routine.name}</span>
                <span className="text-[10px] uppercase font-black opacity-50">
                  {routine.exerciseCount || 0} exercícios
                </span>
              </div>
              {editingDay !== null && workoutSchedule[editingDay] === routine.id && <Check className="ml-auto" size={20} />}
            </Button>
          ))}
          
          {routines.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">Nenhuma rotina cadastrada.</p>
              <Link to="/routines/new" onClick={() => setEditingDay(null)}>
                <Button variant="outline" className="text-blue-500 font-bold border-blue-500/20">Criar uma rotina agora</Button>
              </Link>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Progressão */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
          <TrendingUp size={16} />
          Progressão de Carga
        </h2>
        <div className="flex flex-col gap-4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Incremento Compostos (kg)"
              type="number"
              step="0.25"
              value={progression.compoundIncrement}
              onChange={(e) => handleProgressionChange('compoundIncrement', e.target.value)}
              placeholder="2.5"
            />
            <Input 
              label="Incremento Isoladores (kg)"
              type="number"
              step="0.25"
              value={progression.isolationIncrement}
              onChange={(e) => handleProgressionChange('isolationIncrement', e.target.value)}
              placeholder="1.25"
            />
          </div>
          <p className="text-[10px] text-gray-400">
            Valores sugeridos automaticamente ao completar todas as repetições alvo de um exercício.
          </p>
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full gap-2 border-red-100 text-red-500 hover:bg-red-50 dark:border-red-900/20 dark:hover:bg-red-900/10"
              onClick={resetProgressionSuggestions}
            >
              <RotateCcw size={16} />
              Resetar Todas as Sugestões
            </Button>
          </div>
        </div>
      </section>

      {/* Sons & Vibração */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
          <Volume2 size={16} />
          Sons & Vibração
        </h2>
        <div className="flex flex-col gap-2 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
            <div className="flex flex-col">
              <span className="font-bold">Som do Timer</span>
              <span className="text-xs text-gray-400">Aviso sonoro ao final do descanso</span>
            </div>
            <Button 
              variant={restTimerSound ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRestTimerSettings(!restTimerSound, restTimerVibration)}
              className="w-24"
            >
              {restTimerSound ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800">
            <div className="flex flex-col">
              <span className="font-bold">Vibração</span>
              <span className="text-xs text-gray-400">Vibrar ao final do descanso</span>
            </div>
            <Button 
              variant={restTimerVibration ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRestTimerSettings(restTimerSound, !restTimerVibration)}
              className="w-24"
            >
              {restTimerVibration ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
          <Button 
            variant="ghost" 
            className="w-full gap-2 text-blue-500 font-bold mt-2"
            onClick={testAlert}
          >
            <Play size={16} />
            Testar Alerta
          </Button>
        </div>
      </section>

      {/* Dados */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
          <Database size={16} />
          Dados
        </h2>
        <Link 
          to="/settings/backup"
          className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex flex-col">
            <span className="font-bold">Backup & Restauração</span>
            <span className="text-xs text-gray-400">Exportar ou importar seus dados</span>
          </div>
          <ChevronRight size={20} className="text-gray-300" />
        </Link>
      </section>

      {/* Sobre */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 px-1">
          <Info size={16} />
          Sobre
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="font-bold">Versão</span>
            <span className="text-gray-400 font-mono text-xs">{APP_VERSION}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
