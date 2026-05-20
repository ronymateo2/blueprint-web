import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export const HABITS_KEY = ['habits'] as const;

export function useHabits() {
  const queryClient = useQueryClient();
  const { data = [], isLoading, error } = useQuery({
    queryKey: HABITS_KEY,
    queryFn: () => api.habits.list(),
    staleTime: 30_000,
  });

  return {
    habits: data,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? 'Error' : null,
    reload: () => queryClient.invalidateQueries({ queryKey: HABITS_KEY }),
  };
}
