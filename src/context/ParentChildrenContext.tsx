import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import userApi from '@/api/user/user.api';
import type { LinkedChildProfileDTO } from '@/api/types';
import { useAuth } from './EduGameAuthBridge';

interface ParentChildrenContextType {
  linkedChildren: LinkedChildProfileDTO[];
  loadingChildren: boolean;
  selectedChildId: number | null;
  setSelectedChildId: (id: number) => void;
  selectedChild: LinkedChildProfileDTO | null;
  refetchChildren: () => Promise<void>;
}

const ParentChildrenContext = createContext<ParentChildrenContextType | null>(null);

/**
 * Centralise la liste des enfants liés au parent et l'enfant actuellement
 * sélectionné. Monté une seule fois dans ParentLayout, il persiste donc la
 * sélection quand on navigue entre les pages /parent/* (Tableau de bord,
 * Progression, Analyses, Badges, Historique) : tout le contenu affiché reste
 * centré sur le même enfant tant que le parent ne change pas la sélection.
 */
export function ParentChildrenProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [linkedChildren, setLinkedChildren] = useState<LinkedChildProfileDTO[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [selectedChildId, setSelectedChildIdState] = useState<number | null>(null);

  const loadChildren = useCallback(() => {
    setLoadingChildren(true);
    return userApi
      .getLinkedChildren()
      .then((res) => {
        setLinkedChildren(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setLinkedChildren([]))
      .finally(() => setLoadingChildren(false));
  }, []);

  useEffect(() => {
    if (user?.role !== 'parent') return;
    loadChildren();
  }, [user?.role, loadChildren]);

  useEffect(() => {
    if (linkedChildren.length === 0) {
      setSelectedChildIdState(null);
      return;
    }
    if (selectedChildId == null || !linkedChildren.some((c) => c.id === selectedChildId)) {
      setSelectedChildIdState(linkedChildren[0].id);
    }
  }, [linkedChildren, selectedChildId]);

  const selectedChild = useMemo(
    () => linkedChildren.find((c) => c.id === selectedChildId) ?? null,
    [linkedChildren, selectedChildId]
  );

  const value = useMemo<ParentChildrenContextType>(
    () => ({
      linkedChildren,
      loadingChildren,
      selectedChildId,
      setSelectedChildId: setSelectedChildIdState,
      selectedChild,
      refetchChildren: loadChildren,
    }),
    [linkedChildren, loadingChildren, selectedChildId, selectedChild, loadChildren]
  );

  return <ParentChildrenContext.Provider value={value}>{children}</ParentChildrenContext.Provider>;
}

export function useParentChildren() {
  const ctx = useContext(ParentChildrenContext);
  if (!ctx) throw new Error('useParentChildren must be used within ParentChildrenProvider');
  return ctx;
}
