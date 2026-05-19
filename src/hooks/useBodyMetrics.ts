import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { BodyMetrics } from '@/types/database';
import { calculateBodyFat } from '@/lib/utils';
import { useCallback, useMemo } from 'react';

export function useBodyMetrics() {
  const allMetrics = useLiveQuery(async () => {
    return await db.bodyMetrics
      .orderBy('date')
      .reverse()
      .toArray();
  }, []);

  const getLatestMetrics = useCallback(async () => {
    return await db.bodyMetrics
      .orderBy('date')
      .last();
  }, []);

  const getMetricsById = useCallback(async (id: number) => {
    return await db.bodyMetrics.get(id);
  }, []);

  const calculateMetricsData = useCallback(async (data: Partial<BodyMetrics>) => {
    const genderSetting = await db.settings.get('gender');
    const gender = (genderSetting?.value as 'M' | 'F') || 'M';

    const bf = calculateBodyFat(
      gender,
      data.heightCm || 0,
      data.waist || 0,
      data.neck || 0,
      data.hip
    );

    return {
      ...data,
      bodyFatPct: bf ? bf.bf : undefined,
    };
  }, []);

  const createMetrics = useCallback(async (data: Omit<BodyMetrics, 'id'>) => {
    const enrichedData = await calculateMetricsData(data);
    return await db.bodyMetrics.add(enrichedData as BodyMetrics);
  }, [calculateMetricsData]);

  const updateMetrics = useCallback(async (id: number, data: Partial<BodyMetrics>) => {
    const current = await db.bodyMetrics.get(id);
    if (!current) return;

    const merged = { ...current, ...data };
    const enrichedData = await calculateMetricsData(merged);
    
    return await db.bodyMetrics.update(id, enrichedData);
  }, [calculateMetricsData]);

  const deleteMetrics = useCallback(async (id: number) => {
    return await db.bodyMetrics.delete(id);
  }, []);

  return useMemo(() => ({
    allMetrics: allMetrics || [],
    isLoading: allMetrics === undefined,
    getLatestMetrics,
    getMetricsById,
    createMetrics,
    updateMetrics,
    deleteMetrics
  }), [
    allMetrics,
    getLatestMetrics,
    getMetricsById,
    createMetrics,
    updateMetrics,
    deleteMetrics
  ]);
}
