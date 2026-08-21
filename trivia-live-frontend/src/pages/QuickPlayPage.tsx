import { useState } from 'react';
import { CheckCircle2, RotateCcw, Trophy } from 'lucide-react';
import { CategoryGrid } from '../components/CategoryGrid';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerOptions } from '../components/AnswerOptions';
import { TimerBar } from '../components/TimerBar';
import { useCountdown } from '../hooks/useCountdown';
import { useSubmitMatch } from '../hooks/useTriviaApi';
import type { Category, LiveQuestion, UserProfile } from '../types';

// Local mock question bank — Quick Play has no dedicated "fetch question" REST
// endpoint in the brief, so this offline set stands in for it. Swap this out
// for a real `GET /questions?categoryId=...` call once that endpoint exists.
const MOCK_QUESTIONS: Omit<LiveQuestion, 'serverStartTs'>[] = [
  {
    questionId: 'q1',
    categoryName: 'General',
    prompt: 'Which planet is known as the Red Planet?',
    timeLimitSec: 15,
    options: [
      { id: 'a', text: 'Venus' },
      { id: 'b', text: 'Mars' },
      { id: 'c', text: 'Jupiter' },
      { id: 'd', text: 'Saturn' },
    ],
  },
  {
    questionId: 'q2',
    categoryName: 'General',
    prompt: 'What is the capital of Nigeria?',
    timeLimitSec: 15,
    options: [
      { id: 'a', text: 'Lagos' },
      { id: 'b', text: 'Kano' },
      { id: 'c', text: 'Abuja' },
      { id: 'd', text: 'Ibadan' },
    ],
  },
  {
    questionId: 'q3',
    categoryName: 'General',
    prompt: 'Who wrote the play "Things Fall Apart"?',
    timeLimitSec: 15,
    options: [
      { id: 'a', text: 'Wole Soyinka' },
      { id: 'b', text: 'Chinua Achebe' },
      { id: 'c', text: 'Chimamanda Ngozi Adichie' },
      { id: 'd', text: 'Ben Okri' },
    ],
  },
];

const CORRECT_ANSWERS: Record<string, string> = { q1: 'b', q2: 'c', q3: 'b' };

function calcScore(remainingSec: number, timeLimit: number): number {
  const MIN_FRACTION = 0.3;
  const DECAY = 1.3;
  const frac = Math.max(0, Math.min(remainingSec, timeLimit)) / timeLimit;
  return Math.round(100 * (MIN_FRACTION + (1 - MIN_FRACTION) * Math.pow(frac, DECAY)));
}

export function QuickPlayPage({ profile }: { profile: UserProfile }) {
  const [kids, setKids] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const { submit, submitting } = useSubmitMatch();

  const question = category ? { ...MOCK_QUESTIONS[qIndex], serverStartTs: startedAt ?? Date.now() } : null;
  const { remainingSec, percentRemaining } = useCountdown(question?.timeLimitSec ?? 15, startedAt);

  const beginRound = (cat: Category) => {
    setCategory(cat);
    setQIndex(0);
    setScore(0);
    setFinished(false);
    setStartedAt(Date.now());
  };

  const handleAnswer = (optionId: string) => {
    if (!question) return;
    setSelectedId(optionId);
    const correct = CORRECT_ANSWERS[question.questionId] === optionId;
    setWasCorrect(correct);
    const earned = correct ? calcScore(remainingSec, question.timeLimitSec) : 0;
    setScore((s) => s + earned);

    setTimeout(() => {
      if (qIndex + 1 < MOCK_QUESTIONS.length) {
        setQIndex((i) => i + 1);
        setSelectedId(null);
        setWasCorrect(null);
        setStartedAt(Date.now());
      } else {
        setFinished(true);
        submit({
          userId: profile.userId,
          gameMode: 'quick_play',
          score,
          countryCode: profile.countryCode,
        });
      }
    }, 1200);
  };

  const reset = () => {
    setCategory(null);
    setFinished(false);
  };

  // ---------- Step 1: category selection ----------
  if (!category) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold mb-1">Quick Play</h1>
        <p className="text-slate-400 text-sm mb-6">One instant match. Standard rules, your pick of category.</p>
        <CategoryGrid kids={kids} onToggleKids={setKids} selectedId={null} onSelect={beginRound} />
      </div>
    );
  }

  // ---------- Step 3: results ----------
  if (finished) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-arcade-gold/15 text-arcade-gold flex items-center justify-center mb-4">
          <Trophy size={28} />
        </div>
        <h1 className="font-display text-2xl font-bold mb-1">Match complete!</h1>
        <p className="text-slate-400 text-sm mb-6">
          {submitting ? 'Saving your score…' : 'Score submitted to your profile.'}
        </p>
        <div className="card p-6 mb-6">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Final score</p>
          <p className="font-mono text-4xl font-extrabold text-arcade-gold">{score}</p>
        </div>
        <button onClick={reset} className="btn-primary w-full flex items-center justify-center gap-2">
          <RotateCcw size={16} />
          Play again
        </button>
      </div>
    );
  }

  // ---------- Step 2: gameplay ----------
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-500">
          Question {qIndex + 1} of {MOCK_QUESTIONS.length}
        </span>
        <span className="font-mono text-sm font-bold text-arcade-gold flex items-center gap-1">
          <CheckCircle2 size={14} /> {score} pts
        </span>
      </div>

      <TimerBar remainingSec={remainingSec} percentRemaining={percentRemaining} />
      {question && <QuestionCard question={question} />}
      {question?.options && (
        <AnswerOptions
          options={question.options}
          disabled={selectedId !== null}
          onSelect={handleAnswer}
          wasCorrect={wasCorrect}
          selectedId={selectedId}
        />
      )}
    </div>
  );
}
