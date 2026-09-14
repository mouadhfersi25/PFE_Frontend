import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useParentChildren } from '@/context';

/**
 * Sélecteur d'enfant réutilisable sur chaque section /parent/* (Tableau de
 * bord, Progression, Analyses, Badges, Historique). Piloté par
 * ParentChildrenContext : changer d'enfant ici met à jour immédiatement les
 * données affichées dans la section courante, sans revenir au dashboard.
 */
interface ChildSwitcherProps {
  className?: string;
  /** N'affiche le bouton « Ajouter » que sur le Tableau de bord — les autres sections
   * n'ont besoin que de basculer entre enfants déjà existants. */
  showAdd?: boolean;
}

export default function ChildSwitcher({ className = '', showAdd = false }: ChildSwitcherProps) {
  const navigate = useNavigate();
  const { linkedChildren, selectedChildId, setSelectedChildId } = useParentChildren();

  if (linkedChildren.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {linkedChildren.map((c) => {
        const isActive = c.id === selectedChildId;
        const initial = (c.prenom?.[0] ?? '?').toUpperCase();
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedChildId(c.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                : 'border-blue-100 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-700'
              }`}
              aria-hidden
            >
              {initial}
            </span>
            {c.prenom} {c.nom}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-700'
              }`}
            >
              Niv. {c.niveau ?? 1}
            </span>
          </button>
        );
      })}
      {showAdd && (
        <button
          type="button"
          onClick={() => navigate('/parent/add-child')}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-sky-300 bg-white px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      )}
    </div>
  );
}
