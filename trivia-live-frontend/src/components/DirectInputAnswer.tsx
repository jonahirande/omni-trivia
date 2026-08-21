import { useState } from 'react';
import { Zap, Send } from 'lucide-react';

interface DirectInputAnswerProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export function DirectInputAnswer({ disabled, onSubmit }: DirectInputAnswerProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-arcade-gold bg-arcade-gold/10 border border-arcade-gold/30 rounded-full px-2.5 py-1">
          <Zap size={12} />
          1.5x score bonus for typing it out
        </span>
      </div>
      <div className="flex gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer…"
          className="input-field font-mono"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="btn-primary px-4 flex items-center gap-2"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}
