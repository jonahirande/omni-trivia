import { useEffect, useState } from 'react';
import { ListChecks, Keyboard } from 'lucide-react';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerOptions } from '../components/AnswerOptions';
import { DirectInputAnswer } from '../components/DirectInputAnswer';
import { TimerBar } from '../components/TimerBar';
import { ScorePopup } from '../components/ScorePopup';
import { LiveScoreboard } from '../components/LiveScoreboard';
import { useCountdown } from '../hooks/useCountdown';
import type {
  AnswerReceivedPayload,
  AnswerSubmitPayload,
  InputMode,
  LiveQuestion,
  LiveStanding,
  PlayerJoinedPayload,
  UserProfile,
} from '../types';

interface GamePageProps {
  roomId: string;
  question: LiveQuestion;
  lastScore: AnswerReceivedPayload | null;
  standings: LiveStanding[];
  players: PlayerJoinedPayload[];
  profile: UserProfile;
  onSubmitAnswer: (payload: AnswerSubmitPayload) => void;
}

export function GamePage({ roomId, question, lastScore, standings, players, profile, onSubmitAnswer }: GamePageProps) {
  const [inputMode, setInputMode] = useState<InputMode>('multiple_choice');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [popupKey, setPopupKey] = useState(0);

  // Reset local answer state whenever a new question arrives
  useEffect(() => {
    setSelectedId(null);
    setAnswered(false);
  }, [question.questionId]);

  useEffect(() => {
    if (lastScore && lastScore.questionId === question.questionId) {
      setPopupKey((k) => k + 1);
    }
  }, [lastScore, question.questionId]);

  const { remainingSec, percentRemaining } = useCountdown(question.timeLimitSec, question.serverStartTs);

  const wasCorrect = answered && lastScore?.questionId === question.questionId ? lastScore.scoreEarned > 0 : null;

  const submitMcq = (optionId: string) => {
    setSelectedId(optionId);
    setAnswered(true);
    onSubmitAnswer({
      roomId,
      questionId: question.questionId,
      userId: profile.userId,
      selectedOptionId: optionId,
      inputMode: 'multiple_choice',
    });
  };

  const submitDirect = (text: string) => {
    setAnswered(true);
    onSubmitAnswer({
      roomId,
      questionId: question.questionId,
      userId: profile.userId,
      typedAnswer: text,
      inputMode: 'direct_input',
    });
  };

  const canToggleMode = !answered;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_260px] gap-6 items-start">
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500 font-mono">Room {roomId}</span>

          <div className="flex bg-arcade-surface rounded-full p-1 text-xs font-bold">
            <button
              disabled={!canToggleMode}
              onClick={() => setInputMode('multiple_choice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                inputMode === 'multiple_choice' ? 'bg-arcade-violet text-white' : 'text-slate-400'
              }`}
            >
              <ListChecks size={13} />
              Options
            </button>
            <button
              disabled={!canToggleMode}
              onClick={() => setInputMode('direct_input')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                inputMode === 'direct_input' ? 'bg-arcade-violet text-white' : 'text-slate-400'
              }`}
            >
              <Keyboard size={13} />
              Type
            </button>
          </div>
        </div>

        <TimerBar remainingSec={remainingSec} percentRemaining={percentRemaining} />

        <div className="relative">
          <ScorePopup
            points={lastScore?.scoreEarned ?? 0}
            visible={answered && lastScore?.questionId === question.questionId}
            animKey={popupKey}
          />
          <QuestionCard question={question} />
        </div>

        {inputMode === 'multiple_choice' && question.options ? (
          <AnswerOptions
            options={question.options}
            disabled={answered}
            onSelect={submitMcq}
            wasCorrect={wasCorrect}
            selectedId={selectedId}
          />
        ) : (
          <DirectInputAnswer disabled={answered} onSubmit={submitDirect} />
        )}

        {answered && (
          <p className="text-center text-xs text-slate-500 mt-4">
            Answer locked in — waiting for the next question…
          </p>
        )}
      </div>

      <div className="space-y-4">
        <LiveScoreboard standings={standings} currentUserId={profile.userId} players={players} />
      </div>
    </div>
  );
}
