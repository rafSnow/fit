import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/hooks/useTheme';
import { db } from '@/lib/db';
import { 
  ChevronRight, 
  ChevronLeft, 
  Moon, 
  Sun, 
  Database, 
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingPageProps {
  onComplete: () => void;
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    name: '',
    gender: 'M' as 'M' | 'F',
    height: '',
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = async () => {
    // Save settings
    await db.settings.put({ key: 'name', value: data.name });
    await db.settings.put({ key: 'gender', value: data.gender });
    await db.settings.put({ key: 'defaultHeight', value: data.height });
    await db.settings.put({ key: 'onboarding_complete', value: true });
    onComplete();
  };

  const containerVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black p-6 overflow-hidden">
      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-8 mt-4" aria-hidden="true">
        {[1, 2, 3, 4].map(s => (
          <div 
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              step === s ? "w-8 bg-blue-500" : "w-1.5 bg-gray-200 dark:bg-gray-800"
            )}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2 text-center mb-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h1 className="text-3xl font-black tracking-tight">Bem-vindo!</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Vamos começar configurando seu perfil básico para uma experiência personalizada.
                </p>
              </div>
              
              <Input 
                label="Como gostaria de ser chamado?"
                placeholder="Ex: Rafael"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                autoFocus
              />

              <Button onClick={nextStep} className="mt-4 gap-2 h-14 rounded-2xl">
                Próximo
                <ChevronRight size={20} />
              </Button>
              <button 
                onClick={nextStep}
                className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
                aria-label="Pular esta etapa e ir para o próximo passo"
              >
                Pular esta etapa
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2 text-center mb-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mx-auto mb-4">
                  <Activity size={32} />
                </div>
                <h1 className="text-3xl font-black tracking-tight">Bio & Saúde</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Esses dados são usados para calcular seu IMC e outras métricas corporais.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <Select 
                  label="Sexo Biológico"
                  value={data.gender}
                  onChange={(e) => setData({ ...data, gender: e.target.value as 'M' | 'F' })}
                  options={[
                    { label: 'Masculino', value: 'M' },
                    { label: 'Feminino', value: 'F' }
                  ]}
                />
                <Input 
                  label="Altura (cm)"
                  type="number"
                  placeholder="Ex: 175"
                  value={data.height}
                  onChange={(e) => setData({ ...data, height: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button variant="secondary" onClick={prevStep} className="gap-2 h-14 rounded-2xl">
                  <ChevronLeft size={20} />
                  Voltar
                </Button>
                <Button onClick={nextStep} className="gap-2 h-14 rounded-2xl">
                  Próximo
                  <ChevronRight size={20} />
                </Button>
              </div>
              <button 
                onClick={nextStep}
                className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
                aria-label="Pular esta etapa e ir para o próximo passo"
              >
                Pular esta etapa
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2 text-center mb-4">
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mx-auto mb-4">
                  {theme === 'dark' ? <Moon size={32} /> : <Sun size={32} />}
                </div>
                <h1 className="text-3xl font-black tracking-tight">Estilo</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Escolha o tema que mais combina com você ou seu ambiente de treino.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => theme === 'dark' && toggleTheme()}
                  aria-pressed={theme === 'light'}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    theme === 'light' 
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10" 
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                  )}
                >
                  <Sun size={32} className={theme === 'light' ? "text-blue-500" : "text-gray-400"} />
                  <span className={cn("font-black uppercase text-xs tracking-widest", theme === 'light' ? "text-blue-600" : "text-gray-400")}>
                    Claro
                  </span>
                </button>

                <button 
                  onClick={() => theme === 'light' && toggleTheme()}
                  aria-pressed={theme === 'dark'}
                  className={cn(
                    "flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    theme === 'dark' 
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10" 
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                  )}
                >
                  <Moon size={32} className={theme === 'dark' ? "text-blue-500" : "text-gray-400"} />
                  <span className={cn("font-black uppercase text-xs tracking-widest", theme === 'dark' ? "text-blue-600" : "text-gray-400")}>
                    Escuro
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button variant="secondary" onClick={prevStep} className="gap-2 h-14 rounded-2xl">
                  <ChevronLeft size={20} />
                  Voltar
                </Button>
                <Button onClick={nextStep} className="gap-2 h-14 rounded-2xl">
                  Próximo
                  <ChevronRight size={20} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2 text-center mb-4">
                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-4">
                  <Database size={32} />
                </div>
                <h1 className="text-3xl font-black tracking-tight">Backup</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Já utilizou o app antes? Você pode importar seus dados agora.
                </p>
              </div>

              <div className="p-6 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-gray-500">
                  Se você tem um arquivo .json de backup, clique abaixo para restaurar.
                </p>
                <Button variant="outline" className="w-full gap-2 rounded-2xl" onClick={() => document.getElementById('backup-input')?.click()}>
                  <Database size={18} />
                  Selecionar Arquivo
                </Button>
                <input 
                  id="backup-input"
                  type="file" 
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      try {
                        const backup = JSON.parse(event.target?.result as string);
                        if (!backup.version || !backup.data) {
                          alert('Estrutura de backup inválida.');
                          return;
                        }

                        if (window.confirm('Isso substituirá todos os dados atuais. Deseja continuar?')) {
                          const { data: backupData } = backup;
                          
                          // Basic restore logic (simplified from BackupPage)
                          const tables = [
                            db.exercises, db.routines, db.routineExercises, 
                            db.workoutSessions, db.sessionSets, db.cardioSessions, 
                            db.bodyMetrics, db.progressPhotos, db.settings
                          ];
                          await db.transaction('rw', tables, async () => {
                            for (const tableName in backupData) {
                              const table = (db as unknown as Record<string, { clear: () => Promise<void>, bulkAdd: (items: unknown[]) => Promise<unknown> }>)[tableName];
                              const items = backupData[tableName];
                              if (!items || !table) continue;
                              await table.clear();
                              
                              const processedItems = items.map((item: Record<string, unknown>) => {
                                const newItem = { ...item };
                                if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt as string);
                                if (newItem.startedAt) newItem.startedAt = new Date(newItem.startedAt as string);
                                if (newItem.finishedAt) newItem.finishedAt = new Date(newItem.finishedAt as string);
                                if (newItem.completedAt) newItem.completedAt = new Date(newItem.completedAt as string);
                                if (newItem.date) newItem.date = new Date(newItem.date as string);
                                return newItem;
                              });
                              await table.bulkAdd(processedItems);
                            }
                            await db.settings.put({ key: 'onboarding_complete', value: true });
                          });
                          
                          alert('Backup restaurado com sucesso!');
                          window.location.reload();
                        }
                      } catch {
                        alert('Erro ao processar arquivo JSON.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <Button onClick={handleComplete} className="gap-2 h-14 rounded-2xl w-full">
                  Concluir e Começar
                  <CheckCircle2 size={20} />
                </Button>
                <Button variant="ghost" onClick={prevStep} className="gap-2 h-14 rounded-2xl w-full">
                  <ChevronLeft size={20} />
                  Voltar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
