import { useState } from 'react';

interface Option {
  id: string;
  text: string;
}

interface AnswerOptionsProps {
  options: Option[];
  disabled: boolean;
  onSelect: (optionId: string) => void;
  /** true once scoreEarned > 0 has come back for the current pick */
  wasCorrect: boolean | null;
  selectedId: string | null;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AnswerOptions({ options, disabled, onSelect, wasCorrect, selectedId }: AnswerOptionsProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const active = selectedId ?? localSelected;

  const handleClick = (id: string) => {
    if (disabled) return;
    setLocalSelected(id);
    onSelect(id);
  };

  return (
    <div className="grid gap-2.5">
      {options.map((opt, i) => {
        const isSelected = active === opt.id;
        const stateClass = isSelected
          ? wasCorrect === true
            ? 'border-arcade-teal bg-arcade-teal/10 text-arcade-teal'
            : wasCorrect === false
            ? 'border-arcade-coral bg-arcade-coral/10 text-arcade-coral animate-shake'
            : 'border-arcade-violet bg-arcade-violet/10'
          : 'border-white/10 hover:border-arcade-violet/50';

        return (
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => handleClick(opt.id)}
            className={`flex items-center gap-3 text-left card border ${stateClass} px-4 py-3.5 transition disabled:cursor-not-allowed`}
          >
            <span className="w-7 h-7 flex-shrink-0 rounded-lg bg-arcade-surface2 flex items-center justify-center font-mono text-xs font-bold">
              {LETTERS[i] ?? i + 1}
            </span>
            <span className="text-sm font-semibold">{opt.text}</span>
          </button>
        );
      })}
    </div>
  );
}
