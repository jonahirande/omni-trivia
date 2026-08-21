import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';

function generateUserId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `user_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function ProfilePicker({ onSave }: { onSave: (profile: UserProfile) => void }) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('NG');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ userId: generateUserId(), displayName: trimmed, countryCode: country });
  };

  return (
    <div className="max-w-sm mx-auto mt-16 card p-6 animate-slideIn">
      <div className="w-12 h-12 rounded-2xl bg-arcade-gold/15 text-arcade-gold flex items-center justify-center mb-4">
        <Sparkles size={22} />
      </div>
      <h1 className="font-display text-xl font-bold mb-1">Pick your player name</h1>
      <p className="text-sm text-slate-400 mb-5">
        This is how you'll appear on live rooms and leaderboards.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="e.g. QuizNinja_Tomi"
          className="input-field"
        />

        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="input-field appearance-none"
        >
          <option value="NG">🇳🇬 Nigeria</option>
          <option value="GH">🇬🇭 Ghana</option>
          <option value="KE">🇰🇪 Kenya</option>
          <option value="ZA">🇿🇦 South Africa</option>
          <option value="US">🇺🇸 United States</option>
          <option value="GB">🇬🇧 United Kingdom</option>
        </select>

        <button type="submit" disabled={!name.trim()} className="btn-primary w-full">
          Continue
        </button>
      </form>
    </div>
  );
}
