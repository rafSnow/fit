import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useHeader } from '@/hooks/useHeader';
import { useProgressPhotos } from '@/hooks/useProgressPhotos';
import { useToastStore } from '@/stores/useToastStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { 
  Camera, 
  Image as ImageIcon,
  Plus, 
  Trash2, 
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ArrowLeft
} from 'lucide-react';
import { compressImage, cn } from '@/lib/utils';
import type { ProgressPhoto } from '@/types/database';

const CameraIllustration = () => (
  <div className="relative w-40 h-40 flex items-center justify-center">
    <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/20 rounded-full blur-2xl"></div>
    <div className="relative z-10 p-6 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-orange-50 dark:border-orange-900/30">
      <Camera className="h-12 w-12 text-orange-500" />
    </div>
    <div className="absolute top-2 right-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full shadow-lg">
      <ImageIcon className="h-6 w-6 text-blue-500" />
    </div>
  </div>
);

const PhotosSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 p-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="overflow-hidden relative aspect-[3/4] border-none shadow-md">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/20 to-transparent">
          <Skeleton className="h-3 w-20 mb-2 opacity-50" />
          <Skeleton className="h-4 w-12 opacity-50" />
        </div>
      </Card>
    ))}
  </div>
);

function PhotoImage({ blob, alt, className }: { blob: Blob, alt: string, className?: string }) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const newUrl = URL.createObjectURL(blob);
    const timeoutId = setTimeout(() => setUrl(newUrl), 0);
    return () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(newUrl);
    };
  }, [blob]);

  if (!url) return <div className={cn("bg-gray-200 animate-pulse", className)} />;

  return <img src={url} alt={alt} className={className} />;
}

export default function MetricsPhotosPage() {
  const navigate = useNavigate();
  const { allPhotos, createPhoto, deletePhoto, isLoading } = useProgressPhotos();
  const { addToast } = useToastStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [newPhoto, setNewPhoto] = useState<{ blob: Blob | null, date: string, weight: string, notes: string, previewUrl: string | null }>({
    blob: null,
    date: new Date().toISOString().split('T')[0],
    weight: '',
    notes: '',
    previewUrl: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPhoto = selectedIndex !== null ? allPhotos[selectedIndex] : null;

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (newPhoto.previewUrl) {
        URL.revokeObjectURL(newPhoto.previewUrl);
      }
    };
  }, [newPhoto.previewUrl]);

  useHeader(compareMode ? 'Selecionar 2 Fotos' : 'Fotos de Progresso', (
    <Button variant="ghost" size="sm" onClick={() => compareMode ? setCompareMode(false) : navigate(-1)}>
      <ArrowLeft size={20} />
    </Button>
  ));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 800, 0.7, 200);
      const url = URL.createObjectURL(compressed);
      
      setNewPhoto(prev => {
        if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return { ...prev, blob: compressed, previewUrl: url };
      });
    } catch {
      addToast('Erro ao processar imagem', 'error');
    }
    
    // Reset input value to allow selecting same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerPicker = (mode: 'camera' | 'gallery') => {
    if (fileInputRef.current) {
      if (mode === 'camera') {
        fileInputRef.current.setAttribute('capture', 'user');
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    if (!newPhoto.blob) return;

    setIsSaving(true);
    try {
      await createPhoto({
        date: new Date(newPhoto.date + 'T12:00:00'), // Ensure noon to avoid timezone shifts
        photoBlob: newPhoto.blob,
        weightKg: newPhoto.weight ? parseFloat(newPhoto.weight) : undefined,
        notes: newPhoto.notes
      });
      addToast('Foto salva com sucesso!');
      setIsAdding(false);
      if (newPhoto.previewUrl) URL.revokeObjectURL(newPhoto.previewUrl);
      setNewPhoto({
        blob: null,
        date: new Date().toISOString().split('T')[0],
        weight: '',
        notes: '',
        previewUrl: null
      });
    } catch {
      addToast('Erro ao salvar foto', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Excluir esta foto permanentemente?')) {
      await deletePhoto(id);
      addToast('Foto excluída.');
      setSelectedIndex(null);
    }
  };

  const toggleCompareId = (id: number) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(i => i !== id));
    } else {
      if (compareIds.length < 2) {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  const handlePhotoClick = (photo: ProgressPhoto, index: number) => {
    if (compareMode) {
      if (photo.id) toggleCompareId(photo.id);
    } else {
      setSelectedIndex(index);
    }
  };

  const navigatePhoto = useCallback((direction: 'prev' | 'next') => {
    if (selectedIndex === null) return;
    const newIndex = direction === 'next' 
      ? (selectedIndex + 1) % allPhotos.length 
      : (selectedIndex - 1 + allPhotos.length) % allPhotos.length;
    setSelectedIndex(newIndex);
  }, [selectedIndex, allPhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      
      if (e.key === 'ArrowLeft') navigatePhoto('prev');
      if (e.key === 'ArrowRight') navigatePhoto('next');
      if (e.key === 'Escape') setSelectedIndex(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, navigatePhoto]);

  if (isLoading) {
    return <PhotosSkeleton />;
  }

  const compareA = compareIds.length >= 1 ? allPhotos.find(p => p.id === compareIds[0]) : null;
  const compareB = compareIds.length >= 2 ? allPhotos.find(p => p.id === compareIds[1]) : null;

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 animate-in fade-in duration-500">
      {allPhotos.length >= 2 && !compareMode && (
        <Button 
          variant="secondary" 
          size="sm" 
          className="self-end gap-2 font-black text-[10px] uppercase tracking-widest"
          onClick={() => {
            setCompareMode(true);
            setCompareIds([]);
          }}
        >
          <Maximize2 size={14} />
          Comparar Fotos
        </Button>
      )}

      {compareMode && (
        <div className="flex items-center justify-between bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
          <span className="text-xs font-bold text-blue-600">
            {compareIds.length === 0 ? 'Selecione a primeira foto' : 
             compareIds.length === 1 ? 'Selecione a segunda foto' : 
             'Pronto para comparar!'}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setCompareMode(false)} className="h-8 text-blue-600">
            Cancelar
          </Button>
        </div>
      )}

      {allPhotos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {allPhotos.map((photo, index) => (
            <Card 
              key={photo.id} 
              className={cn(
                "overflow-hidden relative aspect-[3/4] group border-none shadow-md cursor-pointer transition-all",
                compareMode && compareIds.includes(photo.id!) && "ring-4 ring-blue-500 ring-offset-2 scale-[0.98]",
                compareMode && !compareIds.includes(photo.id!) && "opacity-60"
              )}
              onClick={() => handlePhotoClick(photo, index)}
            >
              <PhotoImage 
                blob={photo.photoBlob} 
                alt={format(new Date(photo.date), 'dd/MM/yyyy')}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
                <p className="text-[10px] font-black uppercase opacity-70">
                  {format(new Date(photo.date), 'dd MMM yyyy', { locale: ptBR })}
                </p>
                {photo.weightKg && (
                  <p className="text-sm font-black">{photo.weightKg}kg</p>
                )}
              </div>
              {compareMode && compareIds.includes(photo.id!) && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                  {compareIds.indexOf(photo.id!) + 1}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          illustration={<CameraIllustration />}
          title="Nenhuma foto"
          description="Acompanhe sua evolução visual registrando fotos de progresso."
          actionLabel="Adicionar Foto"
          onAction={() => setIsAdding(true)}
        />
      )}

      {!compareMode && (
        <FAB onClick={() => setIsAdding(true)}>
          <Plus />
        </FAB>
      )}

      <BottomSheet 
        isOpen={isAdding} 
        onClose={() => !isSaving && setIsAdding(false)}
        title="Nova Foto"
      >
        <div className="flex flex-col gap-6">
          {!newPhoto.previewUrl ? (
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className="flex flex-col items-center gap-3 h-32 border-2 border-dashed"
                onClick={() => triggerPicker('camera')}
              >
                <Camera size={32} className="text-blue-500" />
                <span className="font-bold">Câmera</span>
              </Button>
              <Button 
                variant="outline"
                className="flex flex-col items-center gap-3 h-32 border-2 border-dashed"
                onClick={() => triggerPicker('gallery')}
              >
                <ImageIcon size={32} className="text-blue-500" />
                <span className="font-bold">Galeria</span>
              </Button>
            </div>
          ) : (
            <div 
              className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden cursor-pointer group relative"
              onClick={() => triggerPicker('gallery')}
            >
              <img 
                src={newPhoto.previewUrl} 
                className="w-full h-full object-cover"
                alt="Preview"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-white font-black uppercase text-sm">Trocar Foto</p>
              </div>
            </div>
          )}

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data"
              type="date"
              value={newPhoto.date}
              onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
            />
            <Input
              label="Peso (kg)"
              type="number"
              inputMode="decimal"
              placeholder="0.0"
              value={newPhoto.weight}
              onChange={(e) => setNewPhoto({ ...newPhoto, weight: e.target.value })}
            />
          </div>

          <Textarea
            label="Notas"
            placeholder="Alguma observação?"
            value={newPhoto.notes}
            onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
            maxLength={500}
          />

          <Button 
            className="h-14 text-lg font-black gap-2"
            isLoading={isSaving}
            disabled={!newPhoto.blob}
            onClick={handleSave}
          >
            Salvar Foto
          </Button>
        </div>
      </BottomSheet>

      {/* Full Screen Viewer */}
      {selectedPhoto && !compareMode && (
        <div className="fixed inset-0 z-[200] bg-black animate-in fade-in duration-300 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
            <Button variant="ghost" onClick={() => setSelectedIndex(null)} className="text-white">
              <X size={24} />
            </Button>
            <div className="text-center">
              <p className="text-xs font-black uppercase opacity-70">
                {format(new Date(selectedPhoto.date), 'dd MMMM yyyy', { locale: ptBR })}
              </p>
              {selectedPhoto.weightKg && (
                <p className="text-lg font-black">{selectedPhoto.weightKg}kg</p>
              )}
            </div>
            <Button 
              variant="ghost" 
              className="text-red-500"
              onClick={() => selectedPhoto.id && handleDelete(selectedPhoto.id)}
            >
              <Trash2 size={24} />
            </Button>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center p-4">
            {allPhotos.length > 1 && (
              <>
                <Button 
                  variant="ghost" 
                  className="absolute left-2 text-white/50 hover:text-white z-10 h-20"
                  onClick={(e) => { e.stopPropagation(); navigatePhoto('prev'); }}
                >
                  <ChevronLeft size={48} />
                </Button>
                <Button 
                  variant="ghost" 
                  className="absolute right-2 text-white/50 hover:text-white z-10 h-20"
                  onClick={(e) => { e.stopPropagation(); navigatePhoto('next'); }}
                >
                  <ChevronRight size={48} />
                </Button>
              </>
            )}
            <PhotoImage 
              blob={selectedPhoto.photoBlob} 
              className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
              alt="Full view"
              key={selectedPhoto.id}
            />
          </div>
        </div>
      )}

      {/* Comparison Overlay */}
      {compareMode && compareIds.length === 2 && (
        <div className="fixed inset-0 z-[250] bg-black animate-in fade-in duration-300 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white bg-black/50 backdrop-blur-md">
            <Button variant="ghost" onClick={() => setCompareMode(false)} className="text-white">
              <X size={24} />
            </Button>
            <span className="font-black uppercase tracking-widest">Comparação</span>
            <div className="w-10" />
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative border-r border-white/10">
              <PhotoImage 
                blob={compareA!.photoBlob} 
                className="w-full h-full object-cover"
                alt="Foto A"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-white">
                <p className="text-[10px] font-black uppercase opacity-70">
                  {format(new Date(compareA!.date), 'dd MMM yyyy', { locale: ptBR })}
                </p>
                {compareA!.weightKg && <p className="text-sm font-black">{compareA!.weightKg}kg</p>}
              </div>
            </div>
            <div className="flex-1 relative">
              <PhotoImage 
                blob={compareB!.photoBlob} 
                className="w-full h-full object-cover"
                alt="Foto B"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-white">
                <p className="text-[10px] font-black uppercase opacity-70">
                  {format(new Date(compareB!.date), 'dd MMM yyyy', { locale: ptBR })}
                </p>
                {compareB!.weightKg && <p className="text-sm font-black">{compareB!.weightKg}kg</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
