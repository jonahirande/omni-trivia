import { Baby, Loader2, AlertTriangle } from 'lucide-react';
import { useCategories } from '../hooks/useTriviaApi';
import type { Category } from '../types';

interface CategoryGridProps {
  kids: boolean;
  onToggleKids: (value: boolean) => void;
  selectedId: string | null;
  onSelect: (category: Category) => void;
}

export function CategoryGrid({ kids, onToggleKids, selectedId, onSelect }: CategoryGridProps) {
  const { data: categories, loading, error } = useCategories(kids);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-lg">Choose a category</h2>

        <button
          onClick={() => onToggleKids(!kids)}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            kids
              ? 'bg-arcade-teal/15 border-arcade-teal/40 text-arcade-teal'
              : 'bg-arcade-surface border-white/10 text-slate-400'
          }`}
        >
          <Baby size={14} />
          Kids Mode
          <span
            className={`w-8 h-4 rounded-full relative transition ${kids ? 'bg-arcade-teal' : 'bg-arcade-surface3'}`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                kids ? 'left-4' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading categories…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-arcade-coral text-sm bg-arcade-coral/10 border border-arcade-coral/20 rounded-xl p-4">
          <AlertTriangle size={16} />
          Couldn't load categories ({error}). Is the API running on VITE_API_URL?
        </div>
      )}

      {!loading && !error && categories && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat)}
              className={`card p-4 text-left transition hover:-translate-y-0.5 ${
                selectedId === cat.id
                  ? 'border-arcade-violet ring-2 ring-arcade-violet/40'
                  : 'hover:border-white/15'
              }`}
            >
              <div className="text-2xl mb-2">{cat.iconUrl ? '🎯' : '❓'}</div>
              <div className="text-sm font-semibold">{cat.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
