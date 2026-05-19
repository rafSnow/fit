import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timer, MapPin, Flame, Zap, Heart, TrendingUp, BarChart, FileText, Edit2, Trash2, AlertTriangle } from 'lucide-react';

import { useHeader } from '@/hooks/useHeader';
import { useCardioSessions } from '@/hooks/useCardioSessions';
import { useToastStore } from '@/stores/useToastStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatDuration, formatDistance, formatDate } from '@/lib/utils';
import type { CardioSession } from '@/types/database';

export default function CardioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSessionById, deleteSession } = useCardioSessions();
  const { addToast } = useToastStore();
  
  const [session, setSession] = useState<CardioSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useHeader(session?.type || 'Detalhe do Cardio', (
    <Button variant="ghost" size="sm" onClick={() => navigate(`/cardio/${id}/edit`)}>
      <Edit2 className="h-5 w-5" />
    </Button>
  ));

  useEffect(() => {
    async function loadSession() {
      if (!id) return;
      const data = await getSessionById(Number(id));
      if (data) {
        setSession(data);
      } else {
        addToast('Sessão não encontrada.', 'error');
        navigate('/cardio');
      }
      setIsLoading(false);
    }
    loadSession();
  }, [id, getSessionById, navigate, addToast]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteSession(Number(id));
      addToast('Sessão excluída com sucesso.', 'success');
      navigate('/cardio');
    } catch {
      addToast('Erro ao excluir sessão.', 'error');
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>;
  }

  if (!session) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Corrida': return '🏃';
      case 'Esteira': return '👟';
      case 'Bicicleta': return '🚴';
      case 'Escada': return '🪜';
      default: return '⏱️';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl dark:bg-blue-900/30">
            {getActivityIcon(session.type)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{session.type}</h2>
            <p className="text-sm text-gray-500">{formatDate(new Date(session.date))}</p>
          </div>
        </div>
        <Badge variant="secondary">Concluído</Badge>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center justify-center space-y-1 p-4 text-center">
          <Timer className="h-5 w-5 text-blue-500" />
          <span className="text-xs font-medium text-gray-500">Tempo</span>
          <span className="text-sm font-bold">{formatDuration(session.durationSeconds)}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center space-y-1 p-4 text-center">
          <MapPin className="h-5 w-5 text-green-500" />
          <span className="text-xs font-medium text-gray-500">Distância</span>
          <span className="text-sm font-bold">{formatDistance(session.distanceKm)}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center space-y-1 p-4 text-center">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-xs font-medium text-gray-500">Calorias</span>
          <span className="text-sm font-bold">{session.calories} <span className="text-[10px]">kcal</span></span>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <Card className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Detalhes Adicionais</h3>
        
        <div className="grid grid-cols-2 gap-y-4 pt-4">
          <div className="flex items-center space-x-3">
            <Zap className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-[10px] uppercase text-gray-500">Velocidade Média</p>
              <p className="font-bold">{session.avgSpeed?.toFixed(1) || '-'} <span className="text-[10px]">km/h</span></p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Heart className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-[10px] uppercase text-gray-500">Freq. Cardíaca</p>
              <p className="font-bold">{session.heartRate || '-'} <span className="text-[10px]">bpm</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-[10px] uppercase text-gray-500">{session.type === 'Esteira' ? 'Inclinação' : 'Nível'}</p>
              <p className="font-bold">{session.incline || '-'}%</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <BarChart className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-[10px] uppercase text-gray-500">Esforço (RPE)</p>
              <p className="font-bold">{session.rpe || '-'}/10</p>
            </div>
          </div>
        </div>

        {session.notes && (
          <div className="pt-4">
            <div className="flex items-start space-x-3 text-gray-600 dark:text-gray-400">
              <FileText className="mt-1 h-5 w-5 flex-shrink-0" />
              <p className="text-sm italic">"{session.notes}"</p>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex space-x-3">
        <Button 
          variant="secondary" 
          className="flex-1 space-x-2"
          onClick={() => navigate(`/cardio/${id}/edit`)}
        >
          <Edit2 className="h-4 w-4" />
          <span>Editar</span>
        </Button>
        <Button 
          variant="danger" 
          className="flex-1 space-x-2"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          <span>Excluir</span>
        </Button>
      </div>

      {/* Delete Confirmation */}
      <BottomSheet 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Sessão"
      >
        <div className="space-y-6">
          <div className="flex items-center space-x-3 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
            <p className="text-sm">Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.</p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button variant="danger" size="lg" onClick={handleDelete}>
              Sim, Excluir Agora
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
