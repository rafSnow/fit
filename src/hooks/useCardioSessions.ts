import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { CardioSession } from '@/types/database';

export function useCardioSessions() {
  const sessions = useLiveQuery(
    () => db.cardioSessions.orderBy('date').reverse().toArray()
  );

  const getSessions = async () => {
    return await db.cardioSessions.orderBy('date').reverse().toArray();
  };

  const getSessionById = async (id: number) => {
    return await db.cardioSessions.get(id);
  };

  const createSession = async (session: Omit<CardioSession, 'id'>) => {
    return await db.cardioSessions.add(session as CardioSession);
  };

  const updateSession = async (id: number, session: Partial<CardioSession>) => {
    return await db.cardioSessions.update(id, session);
  };

  const deleteSession = async (id: number) => {
    return await db.cardioSessions.delete(id);
  };

  return {
    sessions: sessions || [], // For reactive list
    isLoading: sessions === undefined,
    getSessions,
    getSessionById,
    createSession,
    updateSession,
    deleteSession,
  };
}
