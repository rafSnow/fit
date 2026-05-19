import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { ProgressPhoto } from '@/types/database';

export function useProgressPhotos() {
  const allPhotos = useLiveQuery(async () => {
    return await db.progressPhotos
      .orderBy('date')
      .reverse()
      .toArray();
  });

  const createPhoto = async (data: Omit<ProgressPhoto, 'id'>) => {
    return await db.progressPhotos.add(data);
  };

  const deletePhoto = async (id: number) => {
    return await db.progressPhotos.delete(id);
  };

  const getPhotoById = async (id: number) => {
    return await db.progressPhotos.get(id);
  };

  return {
    allPhotos: allPhotos || [],
    isLoading: allPhotos === undefined,
    createPhoto,
    deletePhoto,
    getPhotoById
  };
}
