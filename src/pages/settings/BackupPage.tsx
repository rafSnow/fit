import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '@/stores/useToastStore';
import { useHeader } from '@/hooks/useHeader';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { db } from '@/lib/db';
import { 
  Download, 
  Upload, 
  ArrowLeft, 
  AlertTriangle,
  FileJson,
  CheckCircle2,
  Database,
  Info,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface BackupStructure {
  version: string;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

export default function BackupPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<BackupStructure | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useHeader('Backup e Restauração', (
    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
      <ArrowLeft size={20} />
    </Button>
  ));

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const tables = [
        'exercises', 'routines', 'routineExercises', 
        'workoutSessions', 'sessionSets', 'cardioSessions', 
        'bodyMetrics', 'progressPhotos', 'settings'
      ];

      const backupData: Record<string, Record<string, unknown>[]> = {};

      for (const tableName of tables) {
        const table = (db as unknown as Record<string, { toArray: () => Promise<unknown[]> }>)[tableName];
        const data = await table.toArray();

        // Special handling for Blobs in progressPhotos
        if (tableName === 'progressPhotos') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          backupData[tableName] = await Promise.all(data.map(async (item: any) => ({
            ...item,
            photoBlob: await blobToBase64(item.photoBlob)
          })));
        } else {
          backupData[tableName] = data as Record<string, unknown>[];
        }
      }

      const backup: BackupStructure = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        data: backupData
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitness-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Backup exportado com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      addToast('Erro ao exportar backup.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (!backupData.version || !backupData.data) {
          addToast('Estrutura de backup inválida.', 'error');
          return;
        }

        setImportSummary(backupData);
      } catch {
        addToast('Arquivo JSON inválido.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!importSummary) return;
    
    setIsImporting(true);
    try {
      const { data: backupData } = importSummary;
      let totalImported = 0;

      const tables = [
        db.exercises, db.routines, db.routineExercises, 
        db.workoutSessions, db.sessionSets, db.cardioSessions, 
        db.bodyMetrics, db.progressPhotos, db.settings
      ];

      await db.transaction('rw', tables, async () => {
        // Clear all tables
        await db.exercises.clear();
        await db.routines.clear();
        await db.routineExercises.clear();
        await db.workoutSessions.clear();
        await db.sessionSets.clear();
        await db.cardioSessions.clear();
        await db.bodyMetrics.clear();
        await db.progressPhotos.clear();
        await db.settings.clear();

        // Import data
        for (const tableName in backupData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const table = (db as any)[tableName];
          const items = backupData[tableName];
          if (!items || !items.length) continue;

          totalImported += items.length;

          if (tableName === 'progressPhotos') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const processedItems = items.map((item: any) => ({
              ...item,
              date: new Date(item.date),
              photoBlob: base64ToBlob(item.photoBlob)
            }));
            await table.bulkAdd(processedItems);
          } else {
            // Ensure dates are correctly restored
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const processedItems = items.map((item: any) => {
              const newItem = { ...item };
              if (newItem.createdAt) newItem.createdAt = new Date(newItem.createdAt);
              if (newItem.startedAt) newItem.startedAt = new Date(newItem.startedAt);
              if (newItem.finishedAt) newItem.finishedAt = new Date(newItem.finishedAt);
              if (newItem.completedAt) newItem.completedAt = new Date(newItem.completedAt);
              if (newItem.date) newItem.date = new Date(newItem.date);
              return newItem;
            });
            await table.bulkAdd(processedItems);
          }
        }
      });

      addToast(`${totalImported} registros restaurados com sucesso!`, 'success');
      setImportSummary(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error(error);
      addToast('Erro ao restaurar dados.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const getSummaryItems = () => {
    if (!importSummary) return [];
    const d = importSummary.data;
    return [
      { label: 'Exercícios', count: d.exercises?.length || 0 },
      { label: 'Rotinas', count: d.routines?.length || 0 },
      { label: 'Sessões de Treino', count: d.workoutSessions?.length || 0 },
      { label: 'Sessões de Cardio', count: d.cardioSessions?.length || 0 },
      { label: 'Métricas Corporais', count: d.bodyMetrics?.length || 0 },
      { label: 'Fotos de Progresso', count: d.progressPhotos?.length || 0 },
    ].filter(i => i.count > 0);
  };

  return (
    <div className="flex flex-col gap-8 p-4 animate-in fade-in duration-500">
      <div className="flex flex-col items-center text-center gap-4 py-8">
        <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500">
          <Database size={40} />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black">Backup de Dados</h1>
          <p className="text-gray-400 text-sm max-w-[280px]">
            Proteja seus dados exportando um arquivo local ou restaure de um backup anterior.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 shrink-0">
              <Download size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold">Exportar Dados</span>
              <p className="text-xs text-gray-400">Gera um arquivo .json com todos os seus treinos, métricas e fotos.</p>
            </div>
          </div>
          <Button 
            className="w-full gap-2 h-12"
            onClick={handleExport}
            disabled={isExporting || isImporting}
          >
            {isExporting ? 'Exportando...' : (
              <>
                <FileJson size={18} />
                Exportar Backup
              </>
            )}
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
              <Upload size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold">Restaurar Dados</span>
              <p className="text-xs text-gray-400">Importa dados de um arquivo anterior. Isso substituirá seus dados atuais.</p>
            </div>
          </div>
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect}
          />
          <Button 
            variant="outline" 
            className="w-full gap-2 h-12 border-orange-500/20 text-orange-500 hover:bg-orange-50"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }}
            disabled={isExporting || isImporting}
          >
            {isImporting ? 'Restaurando...' : (
              <>
                <Upload size={18} />
                Importar Backup
              </>
            )}
          </Button>
        </div>
      </div>

      <BottomSheet
        isOpen={!!importSummary}
        onClose={() => setImportSummary(null)}
        title="Resumo do Backup"
      >
        <div className="flex flex-col gap-6 pb-8">
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <Info size={20} className="text-blue-500" />
            <div className="flex flex-col">
              <span className="text-sm font-bold">Versão {importSummary?.version}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black">Exportado em: {importSummary && format(new Date(importSummary.exportedAt), 'dd/MM/yyyy HH:mm')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {getSummaryItems().map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="block text-xl font-black text-blue-600 dark:text-blue-400">{item.count}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex gap-3">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
              Ao confirmar, **TODOS os dados atuais** (treinos, fotos e métricas) serão permanentemente apagados e substituídos pelos dados deste arquivo.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setImportSummary(null)}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-2 h-12 bg-red-600 hover:bg-red-700" onClick={confirmImport} disabled={isImporting}>
              <Trash2 size={18} className="mr-2" />
              Confirmar e Restaurar
            </Button>
          </div>
        </div>
      </BottomSheet>

      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-4">
        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Dica de Segurança</span>
          <p className="text-xs text-amber-600 dark:text-amber-500/80 leading-relaxed">
            Recomendamos exportar seus dados mensalmente ou antes de trocar de dispositivo para garantir que nunca perca seu progresso.
          </p>
        </div>
      </div>

      <div className="mt-auto py-8 flex flex-col items-center gap-2 opacity-30">
        <CheckCircle2 size={32} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Seus dados estão seguros e locais</span>
      </div>
    </div>
  );
}
