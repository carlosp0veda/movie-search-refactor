import { useQuery, useQueryClient } from '@tanstack/react-query';
import { movieApi, ApiError } from '@/lib/api';
import { SearchMoviesResponse } from '@/types/movie';

const RESULTS_PER_PAGE = 10;

export const useSearchMovies = (query: string, page: number = 1, enabled: boolean = false) => {
  const queryClient = useQueryClient();

  const queryResult = useQuery<SearchMoviesResponse, ApiError>({
    queryKey: ['movies', 'search', query, page],
    queryFn: () => movieApi.searchMovies(query, page),
    enabled: enabled && query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Prefetch next page - idempotent, won't refetch if already cached
  if (queryResult.data && enabled && query.length > 0) {
    const totalResults = parseInt(queryResult.data.data.totalResults, 10);
    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
    const nextPage = page + 1;

    if (nextPage <= totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['movies', 'search', query, nextPage],
        queryFn: () => movieApi.searchMovies(query, nextPage),
        staleTime: 1000 * 60 * 5,
      });
    }
  }

  return queryResult;
};

