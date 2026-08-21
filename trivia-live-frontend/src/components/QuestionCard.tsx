import type { LiveQuestion } from '../types';

export function QuestionCard({ question }: { question: LiveQuestion }) {
  return (
    <div className="card p-5 mb-5">
      <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-arcade-pink bg-arcade-pink/10 rounded-full px-2.5 py-1 mb-3">
        {question.categoryName}
      </span>

      {question.mediaUrl && (
        <img
          src={question.mediaUrl}
          alt=""
          className="w-full max-h-48 object-cover rounded-xl mb-3 border border-white/5"
        />
      )}

      <h2 className="font-display text-lg sm:text-xl font-bold leading-snug">{question.prompt}</h2>
    </div>
  );
}
