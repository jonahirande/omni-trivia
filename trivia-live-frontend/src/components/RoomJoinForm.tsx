import { useState } from 'react';
import { DoorOpen, Plus } from 'lucide-react';

interface RoomJoinFormProps {
  onJoin: (roomCode: string) => void;
  disabled?: boolean;
}

function randomRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function RoomJoinForm({ onJoin, disabled }: RoomJoinFormProps) {
  const [code, setCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 4) return;
    onJoin(code.trim().toUpperCase());
  };

  const handleCreate = () => {
    const fresh = randomRoomCode();
    setCode(fresh);
    onJoin(fresh);
  };

  return (
    <div className="card p-6">
      <h2 className="font-display font-bold text-lg mb-1">Join a live room</h2>
      <p className="text-sm text-slate-400 mb-4">Enter a 4-letter room code, or create a new room.</p>

      <form onSubmit={handleJoin} className="flex gap-2 mb-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="XXXX"
          maxLength={4}
          disabled={disabled}
          className="input-field text-center font-mono text-2xl tracking-[0.4em] uppercase"
        />
      </form>

      <div className="flex gap-2">
        <button
          onClick={handleJoin}
          disabled={disabled || code.trim().length !== 4}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          <DoorOpen size={16} />
          Join room
        </button>
        <button
          onClick={handleCreate}
          disabled={disabled}
          className="btn-secondary flex-1 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Create room
        </button>
      </div>
    </div>
  );
}
