import React, { useEffect } from 'react';
import { useHeaderStore } from '@/stores/useHeaderStore';

export const useHeader = (title: string | null, actions?: React.ReactNode) => {
  const setTitle = useHeaderStore((state) => state.setTitle);
  const setActions = useHeaderStore((state) => state.setActions);

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);

  useEffect(() => {
    if (actions !== undefined) {
      setActions(actions);
    }
    return () => setActions(null);
  }, [actions, setActions]);
};
