import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Category, GameMode, LeaderboardEntry, SubmitMatchPayload } from '../types';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Fetches the category list, refetching whenever `kids` changes. */
export function useCategories(kids: boolean) {
  const [state, setState] = useState<AsyncState<Category[]>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    api
      .getCategories(kids)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [kids]);

  return state;
}

/** Fetches the leaderboard for a given mode/country, with a manual `refetch`. */
export function useLeaderboard(mode: GameMode, country = '') {
  const [state, setState] = useState<AsyncState<LeaderboardEntry[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchLeaderboard = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .getLeaderboard(mode, country)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: Error) => setState({ data: null, loading: false, error: err.message }));
  }, [mode, country]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { ...state, refetch: fetchLeaderboard };
}

/** Imperative helper for submitting a completed Quick Play / offline score. */
export function useSubmitMatch() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: SubmitMatchPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.submitMatch(payload);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting, error };
}
